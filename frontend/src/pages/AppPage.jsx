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

  // Chat-related state
  const [chats, setChats] = useState([]); // sidebar list
  const [activeChatId, setActiveChatId] = useState(null); // currently selected chat

  // Helper: load chats for sidebar
  const loadChats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/chats`);
      if (!res.ok) return; // fail silently for now
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

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
        // Once backend is confirmed online, load existing chats
        await loadChats();
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

  // When user selects an existing chat from the sidebar
  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId);
    if (!chatId) {
      // New chat: clear console messages but keep current code
      setConsoleMessages([
        { text: 'Started a new chat.', type: 'assistant' }
      ]);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/chats/${chatId}`);
      if (!res.ok) throw new Error(`Failed to fetch chat ${chatId}`);
      const data = await res.json();

      // Map chat history into console messages
      const historyMessages = (data.messages || []).map(msg => ({
        text: msg.content,
        type: msg.role === 'user' ? 'user' : 'assistant',
      }));

      setConsoleMessages(historyMessages.length ? historyMessages : [
        { text: 'This chat has no messages yet.', type: 'assistant' }
      ]);

      // Optionally, restore last assistant code into the editor
      const lastAssistant = [...(data.messages || [])].reverse().find(m => m.role === 'assistant');
      if (lastAssistant && lastAssistant.content) {
        const codeOnly = extractCodeFromResponse(lastAssistant.content) || lastAssistant.content;
        setCode(codeOnly);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setConsoleMessages(prev => [
        ...prev,
        { text: `Error loading chat: ${err.message}`, type: 'error' },
      ]);
    }
  };

  // Start a brand new chat (no history)
  const handleNewChat = () => {
    setActiveChatId(null);
    // Clear console and editor for a fresh start
    setConsoleMessages([
      { text: 'Started a new chat.', type: 'assistant' }
    ]);
    setCode('');
  };

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
        chat_id: activeChatId, // null for new chat, existing id for continuation
        intent,
        language,
        task: taskText,
        // Use the raw spoken command as a short human-readable title seed
        chat_title: command,
      };

      // Use chat-message endpoint so conversations are persisted in MongoDB
      const res = await fetch(`${BACKEND_URL}/chat-message`, {
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

      // chat-message returns { chat_id, response }
      const newChatId = data && data.chat_id ? data.chat_id : activeChatId;
      if (!activeChatId && newChatId) {
        setActiveChatId(newChatId);
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

      // Refresh sidebar chats list (so newly created or updated chats show up)
      await loadChats();
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
      <main className="flex-grow flex gap-6 p-6 pt-24">
        {/* Sidebar for previous chats */}
        <aside className="w-64 bg-gray-900/60 backdrop-blur-md rounded-xl shadow-2xl p-4 border border-blue-700/30 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-300">Chats</h2>
            <button
              onClick={handleNewChat}
              className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
            >
              New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-sm">
            {chats.length === 0 && (
              <p className="text-gray-500 text-xs">No chats yet. Start talking to create one.</p>
            )}
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full text-left px-2 py-1 rounded border text-xs mb-1 ${
                  activeChatId === chat.id
                    ? 'bg-blue-700/60 border-blue-400 text-white'
                    : 'bg-gray-900/70 border-gray-700 text-gray-200 hover:bg-gray-800'
                }`}
              >
                <div className="truncate">{chat.title || 'Untitled chat'}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main workspace: editor + console */}
        <div className="flex-1 grid md:grid-cols-2 gap-6">
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
            <div className="mt-1 h-72">
              <Console messages={consoleMessages} isProcessing={isProcessing} />
            </div>
            <div className="flex-shrink-0 mt-6">
              <VoiceControl onCommand={handleVoiceCommand} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppPage;