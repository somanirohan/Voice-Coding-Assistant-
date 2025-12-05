from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the service layer logic from base_llm.py
from base_llm import get_ai_response, get_ai_response_with_history
from db import chats_collection, messages_collection, utc_now

# Initialize the FastAPI app
app = FastAPI()

# Enable CORS so the React frontend (Vite dev server) can call the API from the browser
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. Schema Validation (Pydantic Models) [cite: 7] ---

class CodeRequest(BaseModel):
    """
    Defines the request schema for the /code-assistant endpoint.
    """
    intent: str
    language: str = "python"  # default language
    task: str

class CodeResponse(BaseModel):
    """
    Defines the response schema for the /code-assistant endpoint.
    """
    response: str


# --- Chat-related models ---

class ChatMessageRequest(BaseModel):
    """Send a message within a chat.

    If ``chat_id`` is omitted, a new chat is created and its id is
    returned in the response.
    """

    chat_id: Optional[str] = None
    intent: str
    language: str = "python"  # default language
    task: str
    # Optional short title for the chat (e.g. first prompt summary)
    chat_title: Optional[str] = None


class ChatMessageResponse(BaseModel):
    chat_id: str
    response: str


class ChatSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ChatHistoryMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    chat_id: str
    title: str
    messages: List[ChatHistoryMessage]


# --- 1. API Endpoints [cite: 7, 17] ---

@app.get("/", summary="Health Check")
def read_root():
    """
    Health check route.
    """
    return {"message": "Backend running successfully!"}


@app.post("/code-assistant", response_model=CodeResponse, summary="Code Generation and Explanation")
def code_assistant(request: CodeRequest):
    """
    Accepts task and language to generate or explain code.
    
    This endpoint:
    1. Receives the request[cite: 5].
    2. Calls the AI API (via the service layer)[cite: 5].
    3. Returns a well-structured response[cite: 5].
    """
    
    # --- 5. Error Handling [cite: 7] ---
    try:
        # Call the service layer to get the AI response
        ai_generated_text = get_ai_response(
            intent=request.intent,
            language=request.language,
            task=request.task
        )
        
        # Treat only explicit fallback messages from the service layer as errors.
        # If the AI happens to include the word "Error" in a normal response,
        # we do NOT want to turn that into a 503.
        if isinstance(ai_generated_text, str) and ai_generated_text.startswith("Error:"):
            # Handle fallback messages from the service layer 
            raise HTTPException(status_code=503, detail=ai_generated_text)
            
        return CodeResponse(response=ai_generated_text)
        
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

# --- Chat endpoints ---

def _object_id_from_str(id_str: str) -> ObjectId:
    """Helper to convert a string to ObjectId with nice HTTP errors."""

    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid chat_id format.")

def _serialize_chat(chat_doc) -> ChatSummary:
    return ChatSummary(
        id=str(chat_doc["_id"]),
        title=chat_doc.get("title", "Untitled chat"),
        created_at=chat_doc.get("created_at"),
        updated_at=chat_doc.get("updated_at"),
    )


def _summarize_title(text: str) -> str:
    """Create a very short (<= 5 words) chat title from user text."""

    if not text:
        return "New chat"

    cleaned = text.strip().replace("\n", " ")
    words = [w for w in cleaned.split(" ") if w]
    if not words:
        return "New chat"

    short = " ".join(words[:5])
    if len(short) > 60:
        short = short[:57] + "..."
    return short

@app.get("/chats", response_model=List[ChatSummary], summary="List all chats for sidebar")
def list_chats():
    """Return all chats ordered by most recently updated.

    This is intended to power the sidebar of previous conversations.
    """

    chats = (
        chats_collection
        .find()
        .sort("updated_at", -1)
    )

    return [_serialize_chat(c) for c in chats]

@app.get("/chats/{chat_id}", response_model=ChatHistoryResponse, summary="Get messages for a single chat")
def get_chat_history(chat_id: str):
    chat_oid = _object_id_from_str(chat_id)

    chat_doc = chats_collection.find_one({"_id": chat_oid})
    if not chat_doc:
        raise HTTPException(status_code=404, detail="Chat not found.")

    messages_cursor = (
        messages_collection
        .find({"chat_id": chat_oid})
        .sort("created_at", 1)
    )

    messages: List[ChatHistoryMessage] = []
    for m in messages_cursor:
        messages.append(
            ChatHistoryMessage(
                role=m.get("role", "user"),
                content=m.get("content", ""),
                created_at=m.get("created_at"),
            )
        )

    return ChatHistoryResponse(
        chat_id=str(chat_oid),
        title=chat_doc.get("title", "Untitled chat"),
        messages=messages,
    )

@app.post("/chat-message", response_model=ChatMessageResponse, summary="Send a contextual chat message")
def send_chat_message(request: ChatMessageRequest):
    """Send a message, store it in MongoDB, and get a contextual AI reply.

    - If ``chat_id`` is null, a new chat is created.
    - All previous messages from that chat are loaded and passed as context
      to the LLM so it can continue the conversation.
    """

    # Ensure chat exists or create a new one
    now = utc_now()

    if request.chat_id:
        chat_oid = _object_id_from_str(request.chat_id)
        chat_doc = chats_collection.find_one({"_id": chat_oid})
        if not chat_doc:
            raise HTTPException(status_code=404, detail="Chat not found.")
    else:
        # New chat: derive a short title (<= 5 words) from the first user prompt
        base_text = request.chat_title or request.task or "New chat"
        title = _summarize_title(base_text)

        chat_doc = {
            "title": title,
            "created_at": now,
            "updated_at": now,
        }
        result = chats_collection.insert_one(chat_doc)
        chat_oid = result.inserted_id

    # Load previous messages for context
    history_cursor = (
        messages_collection
        .find({"chat_id": chat_oid})
        .sort("created_at", 1)
    )

    history = [
        {"role": m.get("role", "user"), "content": m.get("content", "")}
        for m in history_cursor
    ]

    try:
        ai_generated_text = get_ai_response_with_history(
            intent=request.intent,
            language=request.language,
            task=request.task,
            history=history,
        )

        if isinstance(ai_generated_text, str) and ai_generated_text.startswith("Error:"):
            raise HTTPException(status_code=503, detail=ai_generated_text)

        # Persist user and assistant messages
        messages_collection.insert_one(
            {
                "chat_id": chat_oid,
                "role": "user",
                "content": request.task,
                "intent": request.intent,
                "language": request.language,
                "created_at": now,
            }
        )

        messages_collection.insert_one(
            {
                "chat_id": chat_oid,
                "role": "assistant",
                "content": ai_generated_text,
                "created_at": now,
            }
        )

        # Update chat's last-updated timestamp
        chats_collection.update_one(
            {"_id": chat_oid},
            {"$set": {"updated_at": now}},
        )

        return ChatMessageResponse(chat_id=str(chat_oid), response=ai_generated_text)

    except HTTPException:
        # Re-raise structured HTTP errors as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")


# --- Run the server (as specified in Tech Stack ) ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
