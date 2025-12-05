import os
from datetime import datetime

from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "my_voice_assistant")

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]

# Collections for chats and messages
chats_collection = db["chats"]
messages_collection = db["messages"]


def utc_now() -> datetime:
    """Helper to get current UTC time without timezone info (Mongo-friendly)."""
    return datetime.utcnow()

