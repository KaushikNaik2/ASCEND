# backend/api/routers/syllabus.py

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import asyncio
import os
import json

# Updated Imports
from services.pdf_service import extract_and_clean_pdf, split_into_subjects, calculate_file_hash
from services.llm_service import generate_syllabus_json,merge_syllabus_chunks
from services.database_service import db

# Imports for Refinement Endpoint
from core.templates import get_refinement_prompt
from langchain_google_genai import ChatGoogleGenerativeAI
from schemas.syllabus import Module 

router = APIRouter(
    prefix="/syllabus",
    tags=["Syllabus Processing"]
)

# ==========================================
# 1. SCHEMAS FOR HUMAN-IN-THE-LOOP (HITL)
# ==========================================

class RefinementRequest(BaseModel):
    raw_text: str
    previous_json: dict
    # 🛡️ THE SHIELD: Cap feedback at 500 characters so they can't upload a manifesto
    user_feedback: str = Field(..., max_length=500, description="Specific instructions to fix the module.")
    
class ConfirmSyllabusRequest(BaseModel):
    user_id: str
    golden_syllabus_id: str
    customized_data: list # The final array of modules they approved
    is_edited: bool       # True if they changed anything from the AI draft

# ==========================================
# 2. ENDPOINTS
# ==========================================

@router.post("/upload")
async def upload_syllabus(file: UploadFile = File(...), department_code: str = Form("Unknown")):
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

    async def process_stream():
        # --- 2. THE VAULT CHECK (Saves tokens & time) ---
        yield json.dumps({"progress": 10, "step": 0, "message": "Hashing file and checking Secure Vault..."}) + "\n"
        
        print("🔍 Hashing uploaded file...")
        file_hash = calculate_file_hash(file_bytes)
        
        print(f"📡 Checking Supabase Vault for hash: {file_hash[:10]}...")
        raw_record = db.get_syllabus_by_hash(file_hash)
        
        if raw_record:
            # 🛡️ THE ANTI-FREEZE FIX
            existing_record = raw_record
            if isinstance(existing_record, list) and len(existing_record) > 0:
                existing_record = existing_record[0]
            if isinstance(existing_record, list) and len(existing_record) > 0:
                existing_record = existing_record[0]
            if not isinstance(existing_record, dict):
                existing_record = {}
                    
            print(f"🎯 Vault Hit! Returning cached SSOT for hash: {file_hash[:10]}...")
            yield json.dumps({
                "progress": 100,
                "step": 4,
                "message": "Vault Match Found!",
                "result": {
                    "status": "success",
                    "source": "vault", 
                    "filename": file.filename,
                    "data": existing_record.get("syllabus_data", []),
                    "golden_syllabus_id": existing_record.get("id") 
                }
            }) + "\n"
            return

        # --- 3. THE EXPENSIVE PATH (Extraction & AI) ---
        yield json.dumps({"progress": 20, "step": 1, "message": "Extracting text with PDFPlumber..."}) + "\n"
        try:
            print("📄 Vault Miss. Starting pdfplumber extraction...")
            clean_text = await extract_and_clean_pdf(file_bytes)
            
            print("✂️ Text cleaned. Splitting into subjects...")
            subject_chunks = split_into_subjects(clean_text)
            print(f"✅ Found {len(subject_chunks)} chunks.")
        except Exception as e:
            yield json.dumps({"error": f"PDF Parsing Error: {str(e)}"}) + "\n"
            return

        all_extracted_subjects = []
        total = len(subject_chunks)
        
        for i, chunk in enumerate(subject_chunks):
            current_prog = 30 + int((i / total) * 55)
            yield json.dumps({"progress": current_prog, "step": 2, "message": f"Structuring module {i+1} of {total} with AI..."}) + "\n"
            
            try:
                print(f"⚙️ Sending Subject Chunk {i+1}/{total} to Gemini...")
                ai_response = await generate_syllabus_json(chunk)
                
                if ai_response and getattr(ai_response, 'subjects', None):
                    for subj in ai_response.subjects:
                        if subj.subject_name:
                            all_extracted_subjects.append(subj.model_dump())
                            print(f"✅ Successfully extracted: {subj.subject_name}")
                
                if i < total - 1:
                    await asyncio.sleep(4.5)
            except Exception as e:
                print(f"❌ Failed to parse chunk {i+1}. Error: {e}")
                
        # --- 4. PERSISTENCE (Saving the Draft) ---
        yield json.dumps({"progress": 90, "step": 3, "message": "Merging chunks and finalizing schema..."}) + "\n"
        
        # 🚨 NEW: Merge the duplicated chunks into a clean, flat list
        merged_subjects_data = merge_syllabus_chunks(all_extracted_subjects)

        # 🚨 UPDATED: Validate the merged data instead of the raw extracted data
        valid_subjects = [sub for sub in merged_subjects_data if len(sub.get("modules", [])) > 0]
        
        if not valid_subjects:
            yield json.dumps({"error": "AI failed to extract structured subjects."}) + "\n"
            return

        try:
            # Save the CLEANED, MERGED subjects to the database
            draft_record = db.create_draft_syllabus(
                file_hash=file_hash,
                syllabus_json=valid_subjects,
                department_code=department_code,
                user_id=None 
            )
            print(f"💾 New Syllabus Draft ({department_code}) saved to Supabase!")
            
            # ... (Rest of your existing golden_id extraction and yield block remains identical) ...
            golden_id = None
            if hasattr(draft_record, 'data') and isinstance(draft_record.data, list) and len(draft_record.data) > 0:
                row_data = draft_record.data
                if isinstance(row_data, dict):
                    golden_id = row_data.get('id')
                elif isinstance(row_data, list) and len(row_data) > 0 and isinstance(row_data[0], dict):
                    golden_id = row_data[0].get('id')
        except Exception as db_err:
            print(f"⚠️ Database Save Error: {db_err}")
            golden_id = None

        yield json.dumps({
            "progress": 100,
            "step": 4,
            "message": "Generation Complete!",
            "result": {
                "status": "success",
                "source": "ai_inference", 
                "filename": file.filename,
                "total_subjects_found": len(valid_subjects),
                "data": valid_subjects,
                "golden_syllabus_id": golden_id
            }
        }) + "\n"

    return StreamingResponse(process_stream(), media_type="application/x-ndjson")   


@router.post("/refine")
async def refine_module(payload: RefinementRequest):
    """
    Micro-Prompt Endpoint: Fixes a single module based on user feedback.
    Cheaper and faster than regenerating the whole PDF.
    """
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Missing GOOGLE_API_KEY.")

        llm = ChatGoogleGenerativeAI(
            model="gemini-3.1-flash-lite-preview", 
            temperature=0.1, 
            api_key=api_key
        )
        structured_llm = llm.with_structured_output(Module)
        refinement_chain = get_refinement_prompt() | structured_llm
        
        response = await refinement_chain.ainvoke({
            "raw_text": payload.raw_text,
            "previous_json": str(payload.previous_json),
            "user_feedback": payload.user_feedback
        })
        
        return {"status": "success", "refined_module": response.model_dump()}
    except Exception as e:
        print(f"❌ Refinement Error: {e}")
        raise HTTPException(status_code=500, detail=f"Refinement Failed: {e}")


@router.post("/confirm")
async def confirm_syllabus(payload: ConfirmSyllabusRequest):
    """
    HITL Finalization: Saves the user's approved syllabus to their Sandbox.
    If they had to fix AI errors, it increments the global consensus counter.
    """
    try:
        # 1. Save to the private User Sandbox
        db.save_user_customized_syllabus(
            user_id=payload.user_id,
            golden_syllabus_id=payload.golden_syllabus_id,
            customized_data=payload.customized_data
        )
        
        # 2. If the user had to manually correct the AI, record that vote.
        if payload.is_edited:
            db.increment_edit_consensus(payload.golden_syllabus_id)
            
        return {"status": "success", "message": "Study plan locked in successfully."}
    except Exception as e:
        print(f"❌ Confirmation Error: {e}")
        raise HTTPException(status_code=500, detail="Confirmation Failed. Could not save to database.")