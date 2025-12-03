import React, { useState, useEffect } from 'react';
import CodeEditor from '../components/CodeEditor';
import Console from '../components/Console';
import VoiceControl from '../components/VoiceControl';
import Navbar from '../components/Navbar';

// URL of the FastAPI backend (can be overridden via Vite env: VITE_BACKEND_URL)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Very simple heuristic to infer intent and language from the spoken command
function deriveIntentAndLanguage(command) {
  const cmd = command.toLowerCase();

  let intent = 'generate_code';
  if (cmd.includes('explain')) {
    intent = 'explain_code';
  }

  let language = 'python';
  if (cmd.includes('javascript') || cmd.includes('js')) {
    language = 'javascript';
  } else if (cmd.includes('typescript') || cmd.includes('ts')) {
    language = 'typescript';
  } else if (cmd.includes('python') || cmd.includes('py ')) {
    language = 'python';
  }

  return { intent, language };
}

// Try to extract just the code portion from an AI markdown/text response.
// 1. Prefer fenced code blocks ``` ``` (optionally with a language)
// 2. If multiple fences exist, join them.
// 3. Fallback: return null so caller can decide what to do.
function extractCodeFromResponse(text) {
  if (!text || typeof text !== 'string') return null;

  const fenceRegex = /```[a-zA-Z0-9]*\n([\s\S]*?)```/g;
  // Only use the first fenced code block to avoid inserting multiple examples.
  const match = fenceRegex.exec(text);
  if (match && match[1]) {
    return match[1].trim();
  }

  // No fenced blocks; as a weaker heuristic, try to grab everything after a line like "Here is the code".
  const markerIndex = text.toLowerCase().indexOf('here is the code');
  if (markerIndex !== -1) {
    const afterMarker = text.slice(markerIndex).split('\n').slice(1).join('\n').trim();
    if (afterMarker) return afterMarker;
  }

  return null;
}

function AppPage() {
  const [code, setCode] = useState("def greet(name):\n    print(f\"Hello, {name}!\")\n\ngreet(\"World\")");
  const [consoleMessages, setConsoleMessages] = useState([
    { text: 'Assistant is online. Checking backend connection...', type: 'assistant' }
  ]);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // On mount, check if the backend is reachable
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/`);
        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }
        const data = await res.json();
        setIsBackendOnline(true);
        setConsoleMessages(prev => [
          ...prev,
          { text: data.message || 'Backend connected successfully.', type: 'assistant' },
        ]);
      } catch (err) {
        console.error('Failed to reach backend:', err);
        setIsBackendOnline(false);
        setConsoleMessages(prev => [
          ...prev,
          { text: 'Error: Cannot reach backend at http://localhost:8000', type: 'error' },
        ]);
      }
    };

    checkBackend();
  }, []);

  const handleVoiceCommand = async (command) => {
    // Log the user command
    setConsoleMessages(prev => [
      ...prev,
      { text: `You: "${command}"`, type: 'user' },
    ]);

    if (!isBackendOnline) {
      setConsoleMessages(prev => [
        ...prev,
        { text: 'Error: Backend is not connected.', type: 'error' },
      ]);
      return;
    }

    setIsProcessing(true);

    try {
      // Derive a best-guess intent and language from the spoken command
      const { intent, language } = deriveIntentAndLanguage(command);

      const existingCode = code && code.trim() ? code : null;
      let taskText;

      if (existingCode) {
        taskText = `You are a coding assistant working with existing ${language} code.
Existing code:

${existingCode}

User request (in natural language):
${command}

If the request asks to modify or extend the existing code, respond with the FULL UPDATED code.
Otherwise, respond with a single self-contained ${language} code example.
Your answer must contain the final code inside one fenced code block like:
\`\`\`${language}
...
\`\`\``.trim();
      } else {
        taskText = `User request: ${command}

Respond with a single self-contained ${language} code example.
Your answer must contain the code inside one fenced code block like:
\`\`\`${language}
...
\`\`\``.trim();
      }

      const payload = {
        intent,
        language,
        task: taskText,
      };

      const res = await fetch(`${BACKEND_URL}/code-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const detail = data && data.detail ? data.detail : `Request failed with status ${res.status}`;
        throw new Error(detail);
      }

      const assistantText = data && data.response ? data.response : 'No response from assistant.';

      // Show the full assistant response in the console
      setConsoleMessages(prev => [
        ...prev,
        { text: assistantText, type: 'assistant' },
      ]);

      // Extract only the code portion for the editor.
      const codeOnly = extractCodeFromResponse(assistantText) || assistantText;

      // Replace the editor contents with just the code (no explanation wrapper).
      setCode(codeOnly);
    } catch (err) {
      console.error('Error while calling backend:', err);
      setConsoleMessages(prev => [
        ...prev,
        { text: `Error contacting assistant: ${err.message}`, type: 'error' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950 min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow grid md:grid-cols-2 gap-6 p-6 pt-24">
        
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-2xl p-6 flex flex-col border border-blue-700/30">
          <h2 className="text-xl font-bold text-blue-400 mb-4 flex-shrink-0">Code Editor</h2>
          {/* This container is crucial for the editor's height */}
          <div className="flex-grow min-h-0">
            <CodeEditor code={code} setCode={setCode} />
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-2xl p-6 flex flex-col border border-purple-700/30">
          <h2 className="text-xl font-bold text-purple-400 mb-2 flex-shrink-0">Console</h2>
          <p className="text-xs mb-2 text-gray-400">
            Backend status: {isBackendOnline ? 'Connected' : 'Disconnected'} (using {BACKEND_URL})
          </p>
          <div className="flex-grow min-h-0 mt-1">
            <Console messages={consoleMessages} isProcessing={isProcessing} />
          </div>
          <div className="flex-shrink-0 mt-6">
            <VoiceControl onCommand={handleVoiceCommand} />
          </div>
        </div>

      </main>
    </div>
  );
}

export default AppPage;