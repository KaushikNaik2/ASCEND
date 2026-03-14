import os
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File
from dotenv import load_dotenv
from pathlib import Path

# Load env before importing services so they have access to the API key
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Now import your custom modules
from services.pdf_service import extract_and_clean_pdf
from services.llm_service import generate_syllabus_json

app = FastAPI(title="ASCEND API", version="1.0")

@app.get("/")
def root():
    return {"message": "API is active. Go to /docs to test."}

@app.post("/upload-syllabus")
async def upload_syllabus(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    # 1. Extract and Clean Text
    try:
        file_bytes = await file.read()
        clean_text = await extract_and_clean_pdf(file_bytes)
        
        # Chop the text into subject chunks
        from services.pdf_service import split_into_subjects # Ensure this is imported
        subject_chunks = split_into_subjects(clean_text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Parsing Error: {str(e)}")

    # 2. Iterate through chunks and send to Gemini
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

    # 3. Final Validation
    if not all_extracted_subjects:
         raise HTTPException(status_code=422, detail="AI could not extract any valid subjects from this document.")

    return {
        "status": "success",
        "filename": file.filename,
        "total_subjects_found": len(all_extracted_subjects),
        "data": all_extracted_subjects # This is now a LIST of your SyllabusResponse objects!
    }