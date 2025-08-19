// ---------------- UTILS ----------------
function log(msg) {
  const logEl = document.getElementById("log");
  logEl.innerHTML += `<p>${msg}</p>`;
}

// Convert to base64
function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

// Hash SHA-256
async function sha256(data) {
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2,"0"))
    .join("");
}

// Crypto AES-GCM
async function deriveKey(password, salt) {
  const keyMat = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt, iterations:100000, hash:"SHA-256" },
    keyMat,
    { name:"AES-GCM", length:256 },
    false,
    ["encrypt","decrypt"]
  );
}

async function encryptData(password, data) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const ct   = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, data);
  return { salt: bufToB64(salt), iv: bufToB64(iv), ct: bufToB64(ct) };
}

async function decryptData(password, saltB64, ivB64, ctB64) {
  const salt = b64ToBuf(saltB64);
  const iv   = b64ToBuf(ivB64);
  const key  = await deriveKey(password, salt);
  return crypto.subtle.decrypt({name:"AES-GCM", iv}, key, b64ToBuf(ctB64));
}

// ---------------- ZIP ----------------
async function makeZip(files) {
  const zip = new JSZip();
  for (let f of files) {
    zip.file(f.name, f);
  }
  return await zip.generateAsync({type:"uint8array"});
}

// ---------------- UI ----------------
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
let selectedFiles = [];

dropZone.addEventListener("click", ()=>fileInput.click());
dropZone.addEventListener("dragover", e=>{
  e.preventDefault();
  dropZone.classList.add("hover");
});
dropZone.addEventListener("dragleave", ()=>dropZone.classList.remove("hover"));
dropZone.addEventListener("drop", e=>{
  e.preventDefault();
  dropZone.classList.remove("hover");
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", ()=>handleFiles(fileInput.files));

function handleFiles(files) {
  selectedFiles = [...files];
  preview.innerHTML = "";
  selectedFiles.forEach(f=>{
    preview.innerHTML += `<p>${f.name} - ${(f.size/1024).toFixed(1)} KB</p>`;
  });
}

// ---------------- SAUVEGARDE ----------------
document.getElementById("saveBtn").addEventListener("click", async ()=>{
  if(!selectedFiles.length) return alert("Aucun fichier");
  const password = document.getElementById("password").value;
  if(!password) return alert("Mot de passe requis");

  let data, fileName;
  if(document.getElementById("enableZip").checked){
    data = await makeZip(selectedFiles);
    fileName = "backup.zip";
    log("Fichiers compressés en ZIP.");
  } else {
    const content = {};
    for(let f of selectedFiles){
      const buf = await f.arrayBuffer();
      content[f.name] = bufToB64(buf);
    }
    data = new TextEncoder().encode(JSON.stringify(content));
    fileName = "backup.json";
  }

  let hash = null;
  if(document.getElementById("addHash").checked){
    hash = await sha256(data);
    log("Hash SHA-256: " + hash);
  }

  // Chiffrement
  const enc = await encryptData(password, data);

  const final = {
    meta: { ts: Date.now(), hash },
    enc
  };

  const blob = new Blob([JSON.stringify(final)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sauvegarde.secure.json";
  a.click();
  log("Sauvegarde terminée !");
});

// ---------------- RESTAURATION ----------------
document.getElementById("restoreBtn").addEventListener("click", ()=> {
  document.getElementById("restoreInput").click();
});
document.getElementById("restoreInput").addEventListener("change", async e=>{
  const f = e.target.files[0];
  if(!f) return;
  const text = await f.text();
  const json = JSON.parse(text);
  const password = prompt("Mot de passe ?");
  try {
    const plain = await decryptData(password, json.enc.salt, json.enc.iv, json.enc.ct);

    // Vérif hash
    if(json.meta.hash){
      const computed = await sha256(new Uint8Array(plain));
      if(computed !== json.meta.hash){
        log("⚠️ Hash invalide ! Fichier corrompu.");
      } else {
        log("✅ Hash vérifié, intégrité OK.");
      }
    }

    log("Restauration réussie !");
  } catch(err){
    log("Erreur de déchiffrement: " + err.message);
  }
});
