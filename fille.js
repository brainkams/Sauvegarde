/* app.js — logique complète : drag & drop, chiffrement AES-GCM, sauvegarde/restauration, PWA */
"use strict";

/* ===== Récup des éléments ===== */
const dropArea = document.getElementById('dropArea');
const pickBtn = document.getElementById('pickBtn');
const fileInput = document.getElementById('fileInput');
const fileListEl = document.getElementById('fileList');
const saveBtn = document.getElementById('saveBtn');
const saveEncBtn = document.getElementById('saveEncBtn');
const clearBtn = document.getElementById('clearBtn');
const overallBar = document.getElementById('overallBar');
const statusEl = document.getElementById('status');
const passwordInput = document.getElementById('password');
const encPerFile = document.getElementById('encPerFile');
const skipLarge = document.getElementById('skipLarge');
const threshold = document.getElementById('threshold');

const backupInput = document.getElementById('backupInput');
const passwordDecrypt = document.getElementById('passwordDecrypt');
const restoreBtn = document.getElementById('restoreBtn');
const restoredList = document.getElementById('restoredList');
const showMetaBtn = document.getElementById('showMetaBtn');

let files = []; // {name,type,size,content:dataURL}

/* ===== Utils ===== */
function bytesToSize(bytes){
  if(bytes===0) return '0 B';
  const k=1024; const sizes=['B','KB','MB','GB','TB'];
  const i=Math.floor(Math.log(bytes)/Math.log(k));
  return parseFloat((bytes/Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i];
}
function setProgress(pct, text){
  overallBar.style.width = Math.min(100,Math.max(0,pct)) + '%';
  if(text) statusEl.textContent = text;
}
function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function saveLocalMeta(){
  const meta = {
    createdAt:new Date().toISOString(),
    count: files.length,
    totalSize: files.reduce((s,f)=>s+f.size,0),
    names: files.map(f=>f.name)
  };
  localStorage.setItem('last_backup_meta', JSON.stringify(meta));
}

/* ===== Rendu liste ===== */
function renderList(){
  fileListEl.innerHTML='';
  files.forEach((f,i)=>{
    const row=document.createElement('div');
    row.className='file-row';
    row.innerHTML = `<div>${escapeHtml(f.name)} <span class="status">• ${bytesToSize(f.size)}</span></div>`;
    const del=document.createElement('button');
    del.className='btn ghost';
    del.textContent='Supprimer';
    del.onclick=()=>{ files.splice(i,1); renderList(); };
    row.appendChild(del);
    fileListEl.appendChild(row);
  });
}

/* ===== Chargement fichiers ===== */
function handleFilesList(fileList){
  const thresholdMB = Number(threshold.value) || 50;
  const toRead = []; const excluded=[];
  Array.from(fileList).forEach(f=>{
    if(skipLarge.checked && f.size > thresholdMB*1024*1024) excluded.push(f);
    else toRead.push(f);
  });
  if(excluded.length) alert('Fichiers exclus (> '+thresholdMB+' MB): '+excluded.map(x=>x.name).join(', '));
  if(toRead.length===0) return;

  setProgress(0,'Lecture fichiers...');
  const total = toRead.reduce((s,f)=>s+f.size,0); let loaded=0;
  const promises = toRead.map(f=> new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload = ()=>{
      files.push({name:f.name,type:f.type,size:f.size,content:r.result});
      loaded+=f.size;
      setProgress(Math.round((loaded/total)*100),'Lecture globale');
      res();
    };
    r.onerror = ()=>rej(r.error);
    r.readAsDataURL(f);
  }));

  Promise.all(promises)
    .then(()=>{ renderList(); setProgress(100,'Lecture terminée'); setTimeout(()=>setProgress(0,'Aucune opération en cours'),700); })
    .catch(e=>{ console.error(e); setProgress(0,'Erreur de lecture'); alert('Erreur lors de la lecture des fichiers.'); });
}

/* ===== Drag & drop ===== */
dropArea.addEventListener('dragover', e=>{ e.preventDefault(); dropArea.classList.add('active'); });
dropArea.addEventListener('dragleave', ()=> dropArea.classList.remove('active'));
dropArea.addEventListener('drop', e=>{
  e.preventDefault(); dropArea.classList.remove('active');
  if(e.dataTransfer.files && e.dataTransfer.files.length) handleFilesList(e.dataTransfer.files);
});
pickBtn.addEventListener('click', ()=> fileInput.click());
fileInput.addEventListener('change', e=>{
  if(e.target.files.length) handleFilesList(e.target.files);
  fileInput.value='';
});

/* ===== Crypto: PBKDF2 -> AES-GCM ===== */
async function deriveKey(password, salt, usages=['encrypt','decrypt']){
  const enc=new TextEncoder();
  const km=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2', salt, iterations:150000, hash:'SHA-256'},
    km,
    {name:'AES-GCM', length:256},
    false, usages
  );
}
function u8ToB64(u8){ let s=''; for(let i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s); }
function b64ToU8(b64){ const bin=atob(b64); const u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }

/* Per-file encryption */
async function encryptDataURLPerFile(dataURL, password){
  const [meta,b64] = dataURL.split(',');
  const raw = b64ToU8(b64);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, raw);
  return { meta, salt: u8ToB64(salt), iv: u8ToB64(iv), ciphertext: u8ToB64(new Uint8Array(ct)) };
}
async function decryptPerFileObject(obj, password){
  const salt=b64ToU8(obj.salt);
  const iv=b64ToU8(obj.iv);
  const ct=b64ToU8(obj.ciphertext);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct);
  const u8=new Uint8Array(plain);
  return obj.meta + ',' + u8ToB64(u8);
}

/* Archive encryption (tout en un) */
async function encryptArchive(jsonString, password){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  setProgress(0,"Chiffrement...");
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(jsonString));
  setProgress(100,"Chiffrement terminé");
  return { mode:'archive', salt: u8ToB64(salt), iv: u8ToB64(iv), ciphertext: u8ToB64(new Uint8Array(ct)) };
}
async function decryptArchive(obj, password){
  const salt=b64ToU8(obj.salt);
  const iv=b64ToU8(obj.iv);
  const ct=b64ToU8(obj.ciphertext);
  const key = await deriveKey(password, salt);
  setProgress(0,"Déchiffrement...");
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct);
  setProgress(100,"Déchiffrement terminé");
  return JSON.parse(new TextDecoder().decode(plain));
}

/* ===== Sauvegarde ===== */
saveBtn.addEventListener('click', ()=>{
  if(files.length===0) return alert('Aucun fichier');
  const payload = {
    createdAt:new Date().toISOString(),
    mode:'plain',
    files: files.map(f=>({name:f.name,type:f.type,size:f.size,content:f.content}))
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`backup-plain-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  saveLocalMeta();
});

saveEncBtn.addEventListener('click', async ()=>{
  if(files.length===0) return alert('Aucun fichier');
  const pwd=passwordInput.value||'';
  if(!pwd && !confirm('Aucun mot de passe renseigné — continuer ?')) return;

  setProgress(0,'Préparation...');
  if(encPerFile.checked){
    const out={mode:'per-file',createdAt:new Date().toISOString(),files:[]};
    try{
      for(let i=0;i<files.length;i++){
        const f=files[i];
        setProgress(Math.round((i/files.length)*90),`Chiffrement ${f.name} (${i+1}/${files.length})`);
        const enc=await encryptDataURLPerFile(f.content,pwd);
        out.files.push({name:f.name,type:f.type,size:f.size,encrypted:enc});
      }
      setProgress(100,'Terminé');
      const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`backup-perfile-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
      a.click(); URL.revokeObjectURL(a.href);
      saveLocalMeta();
      setTimeout(()=>setProgress(0,'Aucune opération en cours'),800);
    }catch(e){
      console.error(e); alert('Erreur chiffrement'); setProgress(0,'Erreur');
    }
  } else {
    const payload={createdAt:new Date().toISOString(),mode:'plain-archive',files:files.map(f=>({name:f.name,type:f.type,size:f.size,content:f.content}))};
    try{
      const enc=await encryptArchive(JSON.stringify(payload),pwd);
      const blob=new Blob([JSON.stringify(enc,null,2)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`backup-archive-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
      a.click(); URL.revokeObjectURL(a.href);
      saveLocalMeta();
      setTimeout(()=>setProgress(0,'Aucune opération en cours'),800);
    }catch(e){
      console.error(e); alert('Erreur'); setProgress(0,'Erreur');
    }
  }
});

/* ===== Restauration ===== */
restoreBtn.addEventListener('click', async ()=>{
  const f = backupInput.files?.[0];
  if(!f) return alert('Choisir un JSON de sauvegarde');
  let parsed;
  try{ parsed = JSON.parse(await f.text()); }catch{ return alert('JSON invalide'); }

  // Non chiffré (liste ou archive plain-archive)
  if(parsed.mode === 'plain'){ showRestored(parsed.files); return; }
  if(parsed.mode === 'plain-archive' && parsed.files){ showRestored(parsed.files); return; }

  // Par-fichier chiffré
  if(parsed.mode === 'per-file' && Array.isArray(parsed.files)){
    const pwd=passwordDecrypt.value||'';
    try{
      const out=[];
      for(let i=0;i<parsed.files.length;i++){
        const pf=parsed.files[i];
        setProgress(Math.round((i/parsed.files.length)*80),`Déchiffrement ${pf.name}`);
        const dataURL = await decryptPerFileObject(pf.encrypted, pwd);
        out.push({name:pf.name,type:pf.type,size:pf.size,content:dataURL});
      }
      setProgress(100,'Terminé'); showRestored(out);
      setTimeout(()=>setProgress(0,'Aucune opération en cours'),800);
    }catch(e){
      console.error(e); alert('Erreur déchiffrement (mot de passe ?)'); setProgress(0,'Erreur');
    }
    return;
  }

  // Archive chiffrée (salt+iv+ciphertext)
  if(parsed.salt && parsed.iv && parsed.ciphertext){
    const pwd=passwordDecrypt.value||'';
    try{
      const payload = await decryptArchive(parsed, pwd);
      if(payload && payload.files) showRestored(payload.files);
      else alert('Format inattendu');
    }catch(e){
      console.error(e); alert('Impossible de déchiffrer — mot de passe incorrect ?');
      setProgress(0,'Erreur');
    }
    return;
  }

  alert('Format de sauvegarde non reconnu.');
});

function showRestored(list){
  restoredList.innerHTML='';
  list.forEach(f=>{
    const d=document.createElement('div'); d.className='file-row';
    d.innerHTML = `<div>${escapeHtml(f.name)} <span class="status">• ${bytesToSize(f.size||0)}</span></div>`;
    const a=document.createElement('a'); a.href=f.content; a.download=f.name; a.textContent='Télécharger'; a.className='btn';
    d.appendChild(a); restoredList.appendChild(d);
  });
}

/* ===== Divers ===== */
clearBtn.addEventListener('click', ()=>{
  if(confirm('Vider la liste ?')){ files=[]; renderList(); }
});
showMetaBtn.addEventListener('click', ()=>{
  const raw=localStorage.getItem('last_backup_meta');
  if(!raw) return alert('Aucune méta locale');
  const m=JSON.parse(raw);
  alert(`Dernière sauvegarde:\nDate: ${m.createdAt}\nFichiers: ${m.count}\nTaille: ${bytesToSize(m.totalSize)}`);
});

/* ===== PWA (enregistrement SW + prompt install) ===== */
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js')
    .then(()=>console.log('Service worker enregistré'))
    .catch(e=>console.warn('Service worker échec', e));

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // On pourrait afficher un bouton "Installer" custom ici.
    document.querySelector('.status').textContent = 'Prête à être installée (menu du navigateur).';
  });
}