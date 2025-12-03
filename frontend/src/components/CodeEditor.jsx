import React from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ code, setCode }) {
  return (
    // The h-full class ensures this div fills its parent container
    <div className="bg-gray-950 border border-blue-500/20 rounded-lg overflow-hidden h-full shadow-inner">
      <Editor
        height="100%" // This tells Monaco to fill the div
        theme="vs-dark"
        defaultLanguage="python"
        value={code}
        onChange={(value) => setCode(value)}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on',
        }}
      />
    </div>
  );
}

export default CodeEditor;