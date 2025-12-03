import React, { useEffect, useRef } from 'react';

// New component for the "thinking" indicator
const ProcessingIndicator = () => (
    <div className="flex items-center space-x-2">
        <span className="text-gray-500 mr-2">&gt;</span>
        <span className="italic text-purple-400">Assistant is thinking</span>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
    </div>
);


function Console({ messages, isProcessing }) { // Accept the new prop
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  return (
    <div className="bg-black/70 h-full w-full rounded-lg p-4 font-code text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800 border border-purple-500/20 shadow-inner">
      {messages.map((msg, index) => (
        <p key={index} className={`whitespace-pre-wrap mb-1 ${
            msg.type === 'user' ? 'text-blue-300' :
            msg.type === 'output' ? 'text-green-400' :
            msg.type === 'error' ? 'text-red-500 font-bold' :
            msg.type === 'assistant' ? 'text-purple-300 italic' :
            'text-gray-200'
        }`}>
          <span className="text-gray-500 mr-2">{msg.type === 'user' ? '>>' : '>'}</span>
          {msg.text}
        </p>
      ))}
      
      {/* Conditionally render the indicator */}
      {isProcessing && <ProcessingIndicator />}

      <div ref={endOfMessagesRef} />
    </div>
  );
}

export default Console;