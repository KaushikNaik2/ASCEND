# backend/api/routers/syllabus.py

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Any
import asyncio
import os
import json

# Updated Imports
from services.pdf_service import extract_and_clean_pdf, split_into_subjects, calculate_file_hash
from services.llm_service import generate_syllabus_json,merge_syllabus_chunks
from services.database_service import db

# Imports for Refinement & Mapping Endpoints
from core.templates import get_refinement_prompt, get_syllabus_mapping_prompt
from langchain_google_genai import ChatGoogleGenerativeAI
from schemas.syllabus import Module
from schemas.mapping import SyllabusMappingResponse

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
    customized_data: Any    # dict (atomic mapping) or list (legacy modules)
    is_edited: bool

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
    If atomic mapping data is passed, transforms it into righteous modules/topics format.
    """
    try:
        save_data = payload.customized_data

        # Detect atomic mapping format and transform to modules/topics
        if isinstance(save_data, list) and len(save_data) > 0 and isinstance(save_data[0], dict):
            # Could be raw mapping entries or a single mapping object
            pass  # Already a list — save as-is
        elif isinstance(save_data, dict) and save_data.get("mappings"):
            # Atomic mapping result — transform to RoadmapViewer format
            mapping_data = save_data
            grouped: dict[str, list] = {}
            for m in mapping_data.get("mappings", []):
                key = m.get("module_context", "Ungrouped")
                if key not in grouped:
                    grouped[key] = []
                grouped[key].append(m)

            modules = []
            for i, (module_name, entries) in enumerate(grouped.items()):
                topics = [
                    {
                        "title": e.get("matched_concept") if e.get("matched_concept") != "UNMAPPED" else e.get("syllabus_text"),
                        "syllabus_text": e.get("syllabus_text"),
                        "concept_cluster_id": e.get("concept_cluster_id"),
                        "confidence": e.get("confidence", 0),
                        "is_mapped": e.get("matched_concept") != "UNMAPPED",
                    }
                    for e in entries
                ]
                modules.append({
                    "module_number": f"M{i + 1}",
                    "title": module_name,
                    "topics": topics,
                })

            save_data = {
                "subject_name": mapping_data.get("subject_detected", "My Roadmap"),
                "semester": mapping_data.get("semester"),
                "modules": modules,
            }

        # 1. Save to the private User Sandbox
        db.save_user_customized_syllabus(
            user_id=payload.user_id,
            golden_syllabus_id=payload.golden_syllabus_id,
            customized_data=save_data
        )
        
        # 2. If the user had to manually correct the AI, record that vote.
        if payload.is_edited:
            db.increment_edit_consensus(payload.golden_syllabus_id)
            
        return {"status": "success", "message": "Study plan locked in successfully."}
    except Exception as e:
        print(f"❌ Confirmation Error: {e}")
        raise HTTPException(status_code=500, detail="Confirmation Failed. Could not save to database.")


# ==========================================
# 4. MAPPING MODE (Scope Detector)
# ==========================================

class MappingRequest(BaseModel):
    department_code: str = Field("Unknown", description="Department code to filter Truth Layer concepts.")

@router.post("/map")
async def map_syllabus(
    file: UploadFile = File(...),
    department_code: str = Form("Unknown")
):
    """
    Atomic Mapping Mode: Extracts text from an uploaded PDF, then maps each
    topic to the pre-existing Truth Layer (concept_clusters) using atomic
    concept IDs. The LLM acts as a Scope Detector — no new content is created.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    # 1. Read and validate PDF
    MAX_SIZE = 5 * 1024 * 1024
    CHUNK_SIZE = 1024 * 1024
    
    first_chunk = await file.read(CHUNK_SIZE)
    if not first_chunk.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Security Error: File is not a genuine PDF.")
    
    file_bytes = first_chunk
    while chunk := await file.read(CHUNK_SIZE):
        file_bytes += chunk
        if len(file_bytes) > MAX_SIZE:
            raise HTTPException(status_code=413, detail="Payload Too Large: File exceeds 5MB limit.")

    async def mapping_stream():
        # --- VAULT CHECK: Skip AI if this PDF was already mapped ---
        yield json.dumps({"progress": 5, "step": 0, "message": "Checking Secure Vault..."}) + "\n"
        from services.pdf_service import calculate_file_hash
        file_hash = calculate_file_hash(file_bytes)
        
        cached = db.get_syllabus_by_hash(file_hash)
        if cached:
            existing = cached[0] if isinstance(cached, list) and len(cached) > 0 else cached
            if isinstance(existing, dict) and existing.get("syllabus_data"):
                yield json.dumps({
                    "progress": 100, "step": 3, "message": "Vault Match Found!",
                    "result": {
                        "status": "success", "source": "vault_atomic",
                        "filename": file.filename,
                        "mapping": existing.get("syllabus_data", {}),
                        "golden_syllabus_id": existing.get("id"),
                    }
                }) + "\n"
                return

        # 2. Extract text
        yield json.dumps({"progress": 10, "step": 0, "message": "Extracting text from PDF..."}) + "\n"
        try:
            from services.pdf_service import extract_and_clean_pdf
            clean_text = await extract_and_clean_pdf(file_bytes)
        except Exception as e:
            yield json.dumps({"error": f"PDF Parsing Error: {str(e)}"}) + "\n"
            return

        # 3. Fetch Truth Layer concepts from Supabase
        yield json.dumps({"progress": 30, "step": 1, "message": "Loading Truth Layer concepts..."}) + "\n"
        try:
            response = db.client.table("concept_clusters").select(
                "id, concept_name, subject, branch, semester, difficulty_tier"
            ).execute()
            truth_concepts = response.data if hasattr(response, 'data') else []
            print(f"🔍 Truth Layer query returned {len(truth_concepts)} concepts")
        except Exception as e:
            yield json.dumps({"error": f"Failed to load Truth Layer: {str(e)}"}) + "\n"
            print(f"❌ Truth Layer query EXCEPTION: {e}")
            return

        if not truth_concepts:
            yield json.dumps({"error": "Truth Layer is empty. Run seed_mu_graph.py first."}) + "\n"
            return

        # 4. Build known concepts string for the prompt
        known_concepts_md = "\n".join([
            f"- {c['concept_name']} [{c['subject']} | Sem {c['semester']} | {c['difficulty_tier']}]"
            for c in truth_concepts
        ])

        # 5. Run the Scope Detector LLM
        yield json.dumps({"progress": 50, "step": 2, "message": "Running Scope Detector AI..."}) + "\n"
        try:
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                yield json.dumps({"error": "Missing GOOGLE_API_KEY."}) + "\n"
                return

            llm = ChatGoogleGenerativeAI(
                model="gemini-3.1-flash-lite-preview",
                temperature=0.1,
                api_key=api_key,
            )
            structured_llm = llm.with_structured_output(SyllabusMappingResponse)
            mapping_prompt = get_syllabus_mapping_prompt()
            chain = mapping_prompt | structured_llm

            mapping_result = await chain.ainvoke({
                "known_concepts": known_concepts_md,
                "text": clean_text,
            })
        except Exception as e:
            yield json.dumps({"error": f"Mapping AI Error: {str(e)}"}) + "\n"
            return

        # 6. ATOMIC RESOLUTION: Link matched concept names → concept_clusters UUIDs
        yield json.dumps({"progress": 80, "step": 3, "message": "Resolving atomic concept IDs..."}) + "\n"
        mapping_dict = mapping_result.model_dump() if mapping_result else {}
        
        if mapping_dict.get("mappings"):
            matched_names = [
                m["matched_concept"] for m in mapping_dict["mappings"]
                if m.get("matched_concept") and m["matched_concept"] != "UNMAPPED"
            ]
            subject_detected = mapping_dict.get("subject_detected", "")
            
            # Build a name→UUID lookup from the already-fetched truth_concepts
            concept_id_map = {
                c["concept_name"]: c["id"] for c in truth_concepts
                if c["concept_name"] in matched_names
            }
            
            # Inject concept_cluster_id into each mapping
            for m in mapping_dict["mappings"]:
                m["concept_cluster_id"] = concept_id_map.get(m.get("matched_concept"), None)

        # 7. Cache the mapping result as a draft syllabus
        golden_id = None
        try:
            draft = db.create_draft_syllabus(
                file_hash=file_hash,
                syllabus_json=mapping_dict,
                department_code=department_code,
            )
            if hasattr(draft, 'data') and isinstance(draft.data, list) and len(draft.data) > 0:
                golden_id = draft.data[0].get("id") if isinstance(draft.data[0], dict) else None
        except Exception as e:
            print(f"⚠️ Vault Cache Error (non-fatal): {e}")

        # 8. Return mapping results with concept IDs
        yield json.dumps({
            "progress": 100,
            "step": 4,
            "message": "Atomic Mapping Complete!",
            "result": {
                "status": "success",
                "source": "scope_detector_atomic",
                "filename": file.filename,
                "mapping": mapping_dict,
                "golden_syllabus_id": golden_id,
            }
        }) + "\n"

    return StreamingResponse(mapping_stream(), media_type="application/x-ndjson")