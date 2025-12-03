import React, { useState } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = false;
recognition.lang = 'en-US';

function VoiceControl({ onCommand }) {
  const [isListening, setIsListening] = useState(false);

  const handleListen = () => {
    if (isListening) {
      recognition.stop();
      return;
    }
    recognition.start();
  };

  recognition.onstart = () => setIsListening(true);
  recognition.onend = () => setIsListening(false);
  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    onCommand(transcript);
  };
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  return (
    <div className="text-center">
      <button
        onClick={handleListen}
        className={`font-bold text-lg transition-all duration-300 transform hover:scale-105 text-white py-4 px-10 rounded-full shadow-lg
          ${isListening
            ? 'bg-gradient-to-r from-red-500 to-orange-400 animate-pulse shadow-red-500/50'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/40'
          }`
        }
      >
        {isListening ? 'Listening...' : 'Activate Assistant'}
      </button>
    </div>
  );
}

export default VoiceControl;