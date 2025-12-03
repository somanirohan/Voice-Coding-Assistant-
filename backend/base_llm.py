import os
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
model = genai.GenerativeModel('gemini-2.5-flash')

def get_ai_response(intent: str, language: str, task: str) -> str:
    """
    Manages prompt creation and calls the Gemini API.
    """
    
    # --- 1. Prompt Creation  ---
    # This is a simple prompt based on the API request.
    # You can make this more complex as needed.
    if intent == "generate_code":
        prompt = f"Generate a code snippet in {language} for the following task: {task}"
    elif intent == "explain_code":
        prompt = f"Explain the following {language} code: {task}"
    else:
        prompt = f"You are a helpful coding assistant. Respond to the following request: {task}"

    print(f"DEBUG: Sending prompt to Gemini: {prompt}")

    # --- 2. Gemini API Integration  ---
    try:
        response = model.generate_content(prompt)
        
        # --- 3. Return Fallback (Reliability)  ---
        if not response.parts:
            return "Error: Could not generate a response. Please try again."
            
        return response.text
        
    except Exception as e:
        # Handle API timeouts or other errors 
        print(f"Error calling Gemini API: {e}")
        return "Error: The AI service is currently unavailable. Please try again later."