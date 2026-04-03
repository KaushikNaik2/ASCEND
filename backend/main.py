# backend/main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.security import ContentSizeLimitMiddleware 
from dotenv import load_dotenv
from pathlib import Path

# Load env before importing services so they have access to the API key
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Import routers
from api.routers import syllabus, quiz

app = FastAPI(title="ASCEND API", version="1.0")

# --- CORS CONFIGURATION ---
allowed_origins = [
    "http://localhost:3000",      
    "http://127.0.0.1:3000",      
    "http://localhost:5173",      
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,       
    allow_methods=["*"],          
    allow_headers=["*"],          
)

app.add_middleware(
    ContentSizeLimitMiddleware, 
    max_content_size=5 * 1024 * 1024 
)

# ==========================================
# Application Routers
# ==========================================
app.include_router(syllabus.router)
app.include_router(quiz.router)

@app.get("/")
def root():
    return {"message": "API is active. Go to /docs to test."}