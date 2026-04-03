# backend/api/routers/syllabus.py

from fastapi import APIRouter, File, UploadFile, HTTPException
import asyncio

# 1. UPDATED IMPORTS
from services.pdf_service import extract_and_clean_pdf, split_into_subjects, calculate_file_hash
from services.llm_service import generate_syllabus_json
from services.database_service import db # Ensure db is exported as an instance in database_service.py

router = APIRouter(
    prefix="/syllabus",
    tags=["Syllabus Processing"]
)

@router.post("/upload")
async def upload_syllabus(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    # --- 1. THE FIREWALL (Size & Magic Number Validation) ---
    MAX_SIZE = 5 * 1024 * 1024 
    CHUNK_SIZE = 1024 * 1024   
    
    first_chunk = await file.read(CHUNK_SIZE)
    if not first_chunk.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Security Error: File is not a genuine PDF.")
        
    # Read and accumulate all bytes to calculate hash and check size
    file_bytes = first_chunk
    while chunk := await file.read(CHUNK_SIZE):
        file_bytes += chunk
        if len(file_bytes) > MAX_SIZE:
            raise HTTPException(status_code=413, detail="Payload Too Large: File exceeds 5MB limit.")

    # --- 2. THE VAULT CHECK (Saves tokens & time) ---
    file_hash = calculate_file_hash(file_bytes)
    
    # Check if this exact file already exists in our 'Golden' records
    existing_record = db.get_syllabus_by_hash(file_hash)
    if existing_record:
        print(f"🎯 Vault Hit! Returning cached SSOT for hash: {file_hash[:10]}...")
        return {
            "status": "success",
            "source": "vault", # Inform frontend this was instant
            "filename": file.filename,
            "data": existing_record["syllabus_data"]
        }

    # --- 3. THE EXPENSIVE PATH (Extraction & AI) ---
    try:
        # Pass the bytes we already read to the cleaner
        clean_text = await extract_and_clean_pdf(file_bytes)
        subject_chunks = split_into_subjects(clean_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Parsing Error: {str(e)}")

    all_extracted_subjects = []
    
    for i, chunk in enumerate(subject_chunks):
        try:
            print(f"⚙️ Sending Subject Chunk {i+1}/{len(subject_chunks)} to Gemini...")
            ai_response = await generate_syllabus_json(chunk)
            
            if ai_response and ai_response.subject_name:
                # model_dump converts the Pydantic object to a standard Python dict
                all_extracted_subjects.append(ai_response.model_dump())
                print(f"✅ Successfully extracted: {ai_response.subject_name}")
            
            if i < len(subject_chunks) - 1:
                await asyncio.sleep(4.5)
                
        except Exception as e:
            print(f"❌ Failed to parse chunk {i+1}. Error: {e}")

    # --- 4. PERSISTENCE (Saving the Draft) ---
    valid_subjects = [sub for sub in all_extracted_subjects if len(sub["modules"]) > 0]

    if not valid_subjects:
         raise HTTPException(status_code=422, detail="AI failed to extract structured subjects.")

    # Save to the database as a DRAFT so other students can find it
    try:
        db.create_draft_syllabus(
            file_hash=file_hash,
            syllabus_json=valid_subjects,
            user_id=None # Placeholder until Auth is wired in
        )
        print("💾 New Syllabus Draft saved to the Vault.")
    except Exception as db_err:
        print(f"⚠️ Database Save Error: {db_err}")

    return {
        "status": "success",
        "source": "ai_inference", # Inform frontend this was a fresh parse
        "filename": file.filename,
        "total_subjects_found": len(valid_subjects),
        "data": valid_subjects 
    }