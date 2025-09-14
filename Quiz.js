const quizData = [
  {
    question: "Quel est le langage principalement utilisé pour créer la structure d'une page web ?",
    options: ["HTML", "Python", "JavaScript", "CSS"],
    answer: 0,
    explanation: "HTML est le langage de base pour structurer une page web."
  },
  {
    question: "Quel fichier est utilisé pour décrire les métadonnées d'une application web installable ?",
    options: ["manifest.json", "README.md", "style.css", "package.json"],
    answer: 0,
    explanation: "Le fichier manifest.json définit les icônes, couleurs et comportement d’installation."
  },
  {
    question: "Quel langage est utilisé pour styliser une page web ?",
    options: ["JavaScript", "HTML", "SQL", "CSS"],
    answer: 3,
    explanation: "CSS permet de définir les styles visuels d’une page."
  },
  {
    question: "Quel fichier contient généralement les instructions pour démarrer un serveur Express ?",
    options: ["style.css", "manifest.json", "server.js", "index.html"],
    answer: 2,
    explanation: "server.js est souvent le point d’entrée d’un serveur Express."
  },
  {
    question: "Quel est le rôle d’un service worker ?",
    options: ["Créer des bases de données", "Gérer les styles CSS", "Afficher des images", "Permettre le fonctionnement offline"],
    answer: 3,
    explanation: "Le service worker permet la mise en cache et le mode hors ligne."
  }
];

function loadQuiz() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';
  quizData.forEach((q, i) => {
    const block = document.createElement('div');
    block.className = 'quiz-block';
    block.innerHTML = `
      <h3>${i + 1}. ${q.question}</h3>
      ${q.options.map((opt, j) => `
        <label>
          <input type="radio" name="q${i}" value="${j}">
          ${opt}
        </label><br>
      `).join('')}
    `;
    container.appendChild(block);
  });
}

function submitQuiz() {
  let score = 0;
  let output = '';
  quizData.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const val = selected ? parseInt(selected.value) : null;
    const correct = val === q.answer;

    if (correct) score++;
    output += `
      <div>
        <strong>Q${i + 1}:</strong> ${correct ? '✅ Bonne réponse' : '❌ Mauvaise réponse'}
        <br><em>${q.explanation}</em>
      </div>
    `;
  });

  const feedback = score === quizData.length
    ? "🌟 Parfait ! Tu maîtrises le sujet."
    : score >= quizData.length / 2
    ? "👍 Bien joué ! Tu progresses."
    : "📘 Continue à t’entraîner, tu vas y arriver.";

  document.getElementById('result').innerHTML = `
    <h2>Résultat : ${score}/${quizData.length}</h2>
    <p>${feedback}</p>
    ${output}
  `;
}

function applyTheme(theme) {
  document.body.className = '';
  switch (theme) {
    case 'dark':
      document.body.classList.add('dark-mode');
      break;
    case 'chantier':
      document.body.classList.add('chantier-mode');
      break;
    default:
      document.body.classList.add('light-mode');
  }
}

loadQuiz();
