// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

app.post('/api/quiz', (req, res) => {
  // Traitement du quiz vocal
  res.json({ success: true, message: 'Réponse enregistrée' });
});

app.listen(PORT, () => {
  console.log(`Serveur BKMS lancé sur http://localhost:${PORT}`);
});
