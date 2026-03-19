import os
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from core.security import ContentSizeLimitMiddleware 
from dotenv import load_dotenv
from pathlib import Path

# Load env before importing services so they have access to the API key
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Now import your custom modules
from services.pdf_service import extract_and_clean_pdf
from services.llm_service import generate_syllabus_json

app = FastAPI(title="ASCEND API", version="1.0")

# --- CORS CONFIGURATION ---
# The VIP List: Which frontends are allowed to talk to this backend?
allowed_origins = [
    "http://localhost:3000",      # Standard React/Next.js local port
    "http://127.0.0.1:3000",      # Alternate local IP
    "http://localhost:5173",      # Standard Vite local port (just in case)
    # "https://ascend.vercel.app" # ⚠️ Uncomment and change this when you deploy to production!
]

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,       # MUST be True so your frontend can send the Supabase JWT
    allow_methods=["*"],          # Allows all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],          # Allows all headers (crucial for "Authorization: Bearer <token>")
)
# 2. Size Limit Middleware (Your new bouncer)
    
app.add_middleware(
    ContentSizeLimitMiddleware, 
    max_content_size=5 * 1024 * 1024 # 5 Megabytes
)

@app.get("/")
def root():
    return {"message": "API is active. Go to /docs to test."}

from fastapi import File, UploadFile, HTTPException
import asyncio

@app.post("/upload-syllabus")
async def upload_syllabus(file: UploadFile = File(...)):
    # Basic browser-level check
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    # --- 1. THE FIREWALL (Size & Magic Number Validation) ---
    MAX_SIZE = 5 * 1024 * 1024 # 5MB strict limit
    CHUNK_SIZE = 1024 * 1024   # Read in 1MB chunks
    
    # Read the first chunk to check the file's DNA
    first_chunk = await file.read(CHUNK_SIZE)
    
    # Magic Number Check: Every true PDF starts with exactly these bytes
    if not first_chunk.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Security Error: File is not a genuine PDF.")
        
    total_size = len(first_chunk)
    
    # Stream the rest of the file to verify size WITHOUT loading massive files into RAM
    while chunk := await file.read(CHUNK_SIZE):
        total_size += len(chunk)
        if total_size > MAX_SIZE:
            raise HTTPException(status_code=413, detail="Payload Too Large: File exceeds the 5MB limit.")
            
    # CRITICAL: We just read the whole file to verify it. 
    # We must reset the pointer back to byte 0 so pdfplumber can read it from the beginning.
    await file.seek(0)
    # --------------------------------------------------------

    # 2. Extract and Clean Text
    try:
        # Now it is 100% safe to load the entire file into memory
        file_bytes = await file.read()
        clean_text = await extract_and_clean_pdf(file_bytes)
        
        # Chop the text into subject chunks
        from services.pdf_service import split_into_subjects # Ensure this is imported
        subject_chunks = split_into_subjects(clean_text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Parsing Error: {str(e)}")

    # 3. Iterate through chunks and send to Gemini
    all_extracted_subjects = []
    
    for i, chunk in enumerate(subject_chunks):
        try:
            print(f"⚙️ Sending Subject Chunk {i+1}/{len(subject_chunks)} to Gemini...")
            
            ai_response = await generate_syllabus_json(chunk)
            
            # Only append if Gemini actually found a valid subject in this chunk
            if ai_response and ai_response.subject_name:
                all_extracted_subjects.append(ai_response)
                print(f"✅ Successfully extracted: {ai_response.subject_name}")
            
            # THE THROTTLE: Respect the 15 RPM limit (60 seconds / 15 requests = 4 seconds)
            # We sleep for 4.5 seconds to be perfectly safe before hitting the API again
            if i < len(subject_chunks) - 1:
                print("⏱️ Throttling for 4.5 seconds to respect API rate limits...")
                await asyncio.sleep(4.5)
                
        except Exception as e:
            # If one subject fails, we DO NOT crash the API. We log it and move to the next.
            print(f"❌ Failed to parse chunk {i+1}. Error: {e}")

    # 4. Final Validation & Cleanup
    # Filter out index pages or structural overviews that have no actual modules
    valid_subjects = [sub for sub in all_extracted_subjects if len(sub.modules) > 0]

    if not valid_subjects:
         raise HTTPException(status_code=422, detail="AI could not extract any valid subjects from this document.")

    return {
        "status": "success",
        "filename": file.filename,
        "total_subjects_found": len(valid_subjects),
        "data": valid_subjects 
    }