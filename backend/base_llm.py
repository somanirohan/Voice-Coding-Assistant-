import os
from typing import List, Dict

import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure the Gemini API
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables.")


genai.configure(api_key=api_key)

# Initialize the generative model (as specified in Tech Stack )
model = genai.GenerativeModel("gemini-2.5-flash")

# --- Language helpers ---

_KNOWN_LANGUAGE_KEYWORDS = {
    "python": ["python", "py"],
    "javascript": ["javascript", "js", "node.js", "nodejs"],
    "typescript": ["typescript", "ts"],
    "java": ["java"],
    "c++": ["c++", "cpp", "C + +", "c p p", "C P P"],
    "c#": ["c#", "c sharp", "csharp"],
    "go": ["go", "golang"],
    "rust": ["rust"],
    "php": ["php"],
}

def _infer_language(language: str | None, task: str) -> str:
    """Infer desired language, defaulting to python.

    Rules:
    - If ``language`` is empty/None, use "python" by default.
    - If the user explicitly mentions another language in the task text,
      prefer that over the provided language and over "python" mentions.
    - This lets you keep prompts that talk about existing Python code but
      still ask for e.g. "in JavaScript" or "C++ code".
    """

    base_lang = (language or "").strip().lower() or "python"
    text = task.lower()
    normalized = text.replace(" ", "")

    detected_non_python: str | None = None
    detected_python: str | None = None

    for lang_name, keywords in _KNOWN_LANGUAGE_KEYWORDS.items():
        for kw in keywords:
            kw_l = kw.lower()

            # Basic phrase matches, e.g. "in javascript", "javascript code"
            if f"in {kw_l}" in text or f"{kw_l} code" in text or kw_l in text:
                if lang_name == "python":
                    detected_python = "python"
                else:
                    detected_non_python = lang_name

            # Special-case C++ so phrases like "C + +" are still detected
            if lang_name == "c++":
                if kw_l.replace(" ", "") in normalized:
                    detected_non_python = "c++"

    # If any non-Python language is mentioned, prefer that over python
    if detected_non_python:
        return detected_non_python

    # Fall back to python if explicitly mentioned, otherwise use base_lang
    if detected_python:
        return "python"

    return base_lang

def _build_base_prompt(intent: str, language: str, task: str) -> str:
    """Create the base prompt from intent/language/task.

    This is kept small and re-used so both single-shot and chat flows
    behave consistently.
    """

    lang = _infer_language(language, task)

    if intent == "generate_code":
        return f"Generate a code snippet in {lang} for the following task: {task}"
    elif intent == "explain_code":
        return f"Explain the following {lang} code: {task}"
    else:
        return f"You are a helpful coding assistant. Respond to the following request: {task}"


def _format_history_for_prompt(history: List[Dict[str, str]]) -> str:
    """Turn stored history into a summarized transcript for extra context.

    We aggressively summarize older messages to keep token usage low while
    preserving full detail for the most recent turns.

    Each history item must have keys: ``role`` ("user" or "assistant") and
    ``content`` (the text of the message).
    """

    if not history:
        return ""

    # Keep only a limited number of messages, with older ones summarized.
    MAX_RECENT = 8

    if len(history) <= MAX_RECENT:
        # Small history: just include everything verbatim.
        lines: List[str] = ["Conversation so far:"]
        for item in history:
            role = item.get("role", "user")
            content = item.get("content", "")
            speaker = "User" if role == "user" else "Assistant"
            lines.append(f"{speaker}: {content}")
        return "\n".join(lines)

    earlier = history[:-MAX_RECENT]
    recent = history[-MAX_RECENT:]

    lines = ["Earlier context (summarized):"]
    for item in earlier:
        role = item.get("role", "user")
        content = item.get("content", "")
        if not content:
            continue
        speaker = "User" if role == "user" else "Assistant"
        one_line = content.strip().replace("\n", " ")
        if len(one_line) > 140:
            one_line = one_line[:137] + "..."
        lines.append(f"- {speaker}: {one_line}")

    lines.append("")
    lines.append("Recent messages:")
    for item in recent:
        role = item.get("role", "user")
        content = item.get("content", "")
        speaker = "User" if role == "user" else "Assistant"
        lines.append(f"{speaker}: {content}")

    return "\n".join(lines)


def get_ai_response_with_history(
    intent: str,
    language: str,
    task: str,
    history: List[Dict[str, str]] | None = None,
) -> str:
    """Call Gemini with optional chat history for better context.

    ``history`` is a list of {"role": "user"|"assistant", "content": str}.
    The current user request (``task``) is always included at the end of
    the prompt; you do not need to append it to ``history`` yourself.
    """

    base = _build_base_prompt(intent=intent, language=language, task=task)
    history_text = _format_history_for_prompt(history or [])

    if history_text:
        prompt = (
            "You are continuing an ongoing conversation with a developer. "
            "Use the entire conversation history below when forming your answer, "
            "but focus on the most recent request.\n\n"
            f"{history_text}\n\n"
            f"New user request (most recent):\n{base}"
        )
    else:
        prompt = base

    print(f"DEBUG: Sending prompt to Gemini: {prompt}")

    # --- Gemini API Integration  ---
    try:
        response = model.generate_content(prompt)

        # --- Return Fallback (Reliability)  ---
        if not getattr(response, "parts", None):
            return "Error: Could not generate a response. Please try again."

        return response.text

    except Exception as e:  # pragma: no cover - defensive logging
        # Handle API timeouts or other errors
        print(f"Error calling Gemini API: {e}")
        return "Error: The AI service is currently unavailable. Please try again later."


def get_ai_response(intent: str, language: str, task: str) -> str:
    """Backward-compatible helper for existing single-shot usage.

    Internally this just calls :func:`get_ai_response_with_history` with
    an empty history so the behaviour is identical to before.
    """

    return get_ai_response_with_history(intent=intent, language=language, task=task, history=None)
