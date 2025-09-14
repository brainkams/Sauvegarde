// Composant d'enregistrement vocal
import { useState } from 'react';

function VoiceRecorder() {
  const [recording, setRecording] = useState(false);

  const startRecording = () => {
    // Utiliser MediaRecorder ou Expo Audio
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
    // Envoyer le fichier audio à l'API d'analyse
  };

  return (
    <div className="recorder">
      <button onClick={startRecording}>🎙️ Start</button>
      <button onClick={stopRecording}>⏹️ Stop</button>
    </div>
  );
}
