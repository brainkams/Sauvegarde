// 🌗 Thème clair/sombre
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
}

// 🎠 Carrousel dynamique
let currentSlide = 0;
const items = document.querySelectorAll('.carousel-item');

function showSlide(index) {
  items.forEach((item, i) => {
    item.classList.toggle('fade-in', i === index);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % items.length;
  showSlide(currentSlide);
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + items.length) % items.length;
  showSlide(currentSlide);
}

showSlide(currentSlide);

// 🛡️ Service Worker pour mode offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('✅ Service Worker enregistré'))
    .catch(err => console.error('❌ Erreur Service Worker:', err));
}

// 🔐 Activités distantes simulées
function launchRiddle() {
  alert("🔍 Chasse au trésor lancée !");
}

function simulatePhishing() {
  alert("⚠️ Simulation d’hameçonnage activée !");
}

function reportThreat() {
  alert("🛡️ Mur de menaces ouvert !");
}

function launchScan() {
  alert("📡 Scan collaboratif lancé !");
}

// 🗣️ Quiz vocal avec Web Speech API
function startVoiceQuiz() {
  const synth = window.speechSynthesis;
  const question = "Quel est le nom du système de sécurité utilisé dans Scorpion BKMS ?";
  const utter = new SpeechSynthesisUtterance(question);
  utter.lang = 'fr-FR';
  synth.speak(utter);

  alert("🎤 Écoute la question vocale !");
}
