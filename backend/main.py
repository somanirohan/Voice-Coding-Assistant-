from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the service layer logic from base_llm.py
from base_llm import get_ai_response

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
    language: str
    task: str

class CodeResponse(BaseModel):
    """
    Defines the response schema for the /code-assistant endpoint.
    """
    response: str

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

# --- Run the server (as specified in Tech Stack ) ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)