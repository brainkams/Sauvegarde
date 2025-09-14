document.addEventListener('DOMContentLoaded', () => {
  // 🔢 Récupération du score depuis localStorage
  const score = localStorage.getItem('quizScore') || '3/5';
  document.getElementById('quiz-score').textContent = `Ton dernier score : ${score}`;

  // 📩 Messages simulés
  const messages = [
    "Groupe Amis : Alice a partagé une photo 📷",
    "Groupe Sécurité : Bob a lancé un quiz 🔐",
    "Groupe Quiz : Clara a répondu à une question 🎯"
  ];
  const messageList = document.getElementById('message-list');
  messages.forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg;
    messageList.appendChild(li);
  });

  // 🔔 Notifications simulées
  const notifications = [
    "📌 Nouveau badge débloqué : Explorateur",
    "📅 Événement vendredi : Soirée BKMS",
    "🛡️ Mise à jour sécurité disponible"
  ];
  const notifList = document.getElementById('notif-list');
  notifications.forEach(note => {
    const li = document.createElement('li');
    li.textContent = note;
    notifList.appendChild(li);
  });

  // 👥 Groupes actifs
  const groupes = ["Groupe Amis", "Groupe Sécurité", "Groupe Quiz Collaboratif"];
  const groupList = document.getElementById('group-list');
  groupes.forEach(g => {
    const li = document.createElement('li');
    li.textContent = g;
    groupList.appendChild(li);
  });

  // 📡 Activités en cours
  const activities = ["Chasse au trésor 🗺️", "Scan collaboratif 📡", "Quiz vocal 🎤"];
  const activityList = document.getElementById('activity-list');
  activities.forEach(act => {
    const li = document.createElement('li');
    li.textContent = act;
    activityList.appendChild(li);
  });
});
