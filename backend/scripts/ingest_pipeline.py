# backend/scripts/ingest_pipeline.py
"""
Unified Extract → Transform → Load pipeline for ASCEND concept clusters.

Processes syllabus PDFs (or pre-existing result JSONs) for multiple
departments and seeds the concept_clusters Supabase table with
department-scoped, collision-safe data.

Usage:
    cd backend
    python -m scripts.ingest_pipeline                              # All depts from JSON
    python -m scripts.ingest_pipeline --dept COMPS                 # Single department
    python -m scripts.ingest_pipeline --dept COMPS --sem 3         # Single dept + semester
    python -m scripts.ingest_pipeline --from-pdf                   # Re-extract from PDFs first
    python -m scripts.ingest_pipeline --dry-run                    # Preview without DB writes
"""

import os
import re
import sys
import json
import asyncio
import argparse
import time
from pathlib import Path
from datetime import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

# ============================================================
# Config
# ============================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

_supabase_client = None

def get_supabase():
    """Lazy Supabase client — only connects when actually needed (skipped in dry-run)."""
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("🚨 Missing SUPABASE_URL or SUPABASE_KEY in .env")
            sys.exit(1)
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("🔌 Supabase connected.")
    return _supabase_client

# Rate limit delay between LLM calls (seconds)
RPM_DELAY = 4.5

# Department → PDF mapping with metadata and semester-specific files
DEPARTMENT_CONFIG = {
    "COMPS": {
        "branch": "Computing",
        "semesters": {
            3: "Computer-Science-sem3.pdf",
            4: "Computer-Science-sem4.pdf"
        }
    },
    "IT": {
        "branch": "Computing",
        "semesters": {
            3: "Information-Technology-sem3.pdf",
            4: "Information-Technology-sem4.pdf"
        }
    },
    "AIDS": {
        "branch": "Computing",
        "semesters": {
            3: "A-I-AI-DS-sem3.pdf",
            4: "A-I-AI-DS-sem4.pdf"
        }
    },
    "AIML": {
        "branch": "Computing",
        "semesters": {
            3: "AI-ML-sem3.pdf",
            4: "AI-ML-sem4.pdf"
        }
    },
    "MECH": {
        "branch": "Mechanical",
        "semesters": {
            3: "Mechanical-Engineering-sem3.pdf",
            4: "Mechanical-Engineering-sem4.pdf"
        }
    }
}

# Paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = BACKEND_DIR / "test_pdfs"
RESULTS_DIR = BACKEND_DIR / "test_results"


# ============================================================
# Module Number Normalization
# ============================================================

ROMAN_MAP = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5,
    "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10,
}

def normalize_module_number(raw: str) -> int | None:
    """
    Converts module number strings to integers.
    'Module III' → 3, 'Module 3' → 3, 'III' → 3, '3' → 3
    """
    if raw is None:
        return None
    raw = str(raw).strip()
    
    # Try direct integer
    try:
        return int(raw)
    except ValueError:
        pass
    
    # Extract Roman numeral or digits from string like "Module III"
    match = re.search(r'([IVXLC]+|\d+)\s*$', raw.strip(), re.IGNORECASE)
    if match:
        val = match.group(1).upper()
        if val in ROMAN_MAP:
            return ROMAN_MAP[val]
        try:
            return int(val)
        except ValueError:
            pass
    
    return None


def parse_semester(raw_sem: str | None) -> int | None:
    """Extract integer semester from strings like 'Semester IV', '4', etc."""
    if raw_sem is None:
        return None
    raw_sem = str(raw_sem).strip()
    
    # Direct integer
    try:
        return int(raw_sem)
    except ValueError:
        pass
    
    # "Semester IV" or "Sem 4"
    match = re.search(r'(\d+|[IVXLC]+)\s*$', raw_sem, re.IGNORECASE)
    if match:
        val = match.group(1).upper()
        if val in ROMAN_MAP:
            return ROMAN_MAP[val]
        try:
            return int(val)
        except ValueError:
            pass
    return None


# ============================================================
# Subject Filtering
# ============================================================

# Subjects to SKIP (labs, projects, non-theory)
SKIP_PATTERNS = [
    r'\blab\b', r'\bpractical\b', r'\bproject\b', r'\bmini[- ]project\b',
    r'\bterm[- ]work\b', r'\bworkshop\b', r'\bseminar\b',
    r'\b(?:design\s+thinking)\b', r'\b(?:business\s+model)\b',
    r'\bskill\s+development\b', r'\bvalue\s+education\b',
]

def is_theory_subject(subject_name: str) -> bool:
    """Returns True if the subject is likely a theory subject worth seeding."""
    name_lower = subject_name.lower()
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, name_lower):
            return False
    # Also skip very generic names
    if len(subject_name.strip()) < 5:
        return False
    return True


# ============================================================
# Stage 1: Load existing result JSONs
# ============================================================

def load_result_json(pdf_filename: str) -> list[dict]:
    """Load the pre-existing result JSON derived from a PDF filename.
    e.g., 'Computer-Science-sem3.pdf' → 'Computer-Science-sem3_result.json'
    """
    json_name = pdf_filename.replace('.pdf', '_result.json')
    json_path = RESULTS_DIR / json_name
    
    if not json_path.exists():
        print(f"  ⚠️  Result JSON not found: {json_path}")
        return []
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Handle both formats: direct list or wrapped in {"data": [...]}
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and "data" in data:
        return data["data"]
    return []


async def extract_pdf_to_json(
    pdf_path: Path,
    pdf_filename: str,
    key_manager,
) -> list[dict]:
    """
    Full PDF → JSON extraction pipeline.
    Reads PDF, cleans text, splits into subject chunks, calls Gemini, saves result JSON.
    """
    from services.pdf_service import extract_and_clean_pdf, split_into_subjects
    from services.llm_service import generate_syllabus_json, merge_syllabus_chunks
    
    # 1. Read and clean PDF
    with open(pdf_path, 'rb') as f:
        file_bytes = f.read()
    
    clean_text = await extract_and_clean_pdf(file_bytes)
    if not clean_text or len(clean_text.strip()) < 100:
        print(f"      ⚠️  PDF text too short after cleaning: {len(clean_text)} chars")
        return []
    
    print(f"      📝 Cleaned text: {len(clean_text)} chars")
    
    # 2. Split into subject chunks
    chunks = split_into_subjects(clean_text)
    print(f"      📦 Split into {len(chunks)} subject chunks")
    
    # 3. Extract each chunk via Gemini
    all_subjects_raw = []
    for i, chunk in enumerate(chunks):
        api_key = key_manager.get_next_key()
        try:
            print(f"      🤖 Processing chunk {i+1}/{len(chunks)}...")
            result = await generate_syllabus_json(chunk, api_key)
            
            # Handle SyllabusCollection (has .subjects) or single SyllabusResponse
            if hasattr(result, 'subjects'):
                for subj in result.subjects:
                    all_subjects_raw.append(subj.model_dump() if hasattr(subj, 'model_dump') else subj.dict())
            elif hasattr(result, 'subject_name'):
                all_subjects_raw.append(result.model_dump() if hasattr(result, 'model_dump') else result.dict())
            
            import asyncio
            await asyncio.sleep(RPM_DELAY)
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "Resource" in error_str:
                key_manager.mark_cooling(api_key, 60)
                print(f"      🔄 Rate limited on chunk {i+1}, retrying...")
                import asyncio
                await asyncio.sleep(5)
                api_key2 = key_manager.get_next_key()
                try:
                    result = await generate_syllabus_json(chunk, api_key2)
                    if hasattr(result, 'subjects'):
                        for subj in result.subjects:
                            all_subjects_raw.append(subj.model_dump() if hasattr(subj, 'model_dump') else subj.dict())
                except Exception:
                    print(f"      ❌ Chunk {i+1} failed after retry")
            else:
                print(f"      ❌ Chunk {i+1} extraction failed: {e}")
    
    # 4. Merge duplicate subjects
    merged = merge_syllabus_chunks(all_subjects_raw)
    print(f"      ✅ Merged to {len(merged)} unique subjects")
    
    # 5. Save result JSON
    RESULTS_DIR.mkdir(exist_ok=True)
    json_name = pdf_filename.replace('.pdf', '_result.json')
    json_path = RESULTS_DIR / json_name
    result_data = {
        "status": "success",
        "filename": pdf_filename,
        "total_subjects_found": len(merged),
        "data": merged,
    }
    with open(json_path, 'w') as f:
        json.dump(result_data, f, indent=2, default=str)
    print(f"      💾 Saved result JSON: {json_name}")
    
    return merged


# ============================================================
# Stage 2: Concept Extraction via LLM
# ============================================================

async def extract_concepts_for_subject(
    subject_data: dict,
    dept_code: str,
    key_manager,
) -> list[dict]:
    """
    Calls Gemini to decompose a single subject into atomic concepts.
    Returns a list of concept dicts ready for Supabase insertion.
    """
    from services.llm_service import generate_concepts
    
    subject_name = subject_data.get("subject_name", "Unknown")
    modules = subject_data.get("modules", [])
    
    if not modules:
        print(f"    ⚠️  No modules found for {subject_name}")
        return []
    
    # Prepare subject JSON for the prompt
    subject_json_str = json.dumps(subject_data, indent=2, default=str)
    
    # Get a rotated API key
    api_key = key_manager.get_next_key()
    
    try:
        response = await generate_concepts(subject_json_str, api_key)
        concepts = []
        
        for c in response.concepts:
            concepts.append({
                "concept_name": c.concept_name.strip(),
                "module_number": c.module_number,
                "difficulty_tier": c.difficulty_tier,
                "parent_concept_name": c.parent_concept_name,
            })
        
        return concepts
    
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "Resource" in error_str:
            key_manager.mark_cooling(api_key, 60)
            print(f"    🔄 Rate limited on {subject_name}. Retrying with next key...")
            await asyncio.sleep(5)
            # Retry once with a different key
            api_key2 = key_manager.get_next_key()
            try:
                response = await generate_concepts(subject_json_str, api_key2)
                return [
                    {
                        "concept_name": c.concept_name.strip(),
                        "module_number": c.module_number,
                        "difficulty_tier": c.difficulty_tier,
                        "parent_concept_name": c.parent_concept_name,
                    }
                    for c in response.concepts
                ]
            except Exception as e2:
                print(f"    ❌ Retry also failed for {subject_name}: {e2}")
                return []
        else:
            print(f"    ❌ Concept extraction failed for {subject_name}: {e}")
            return []


# ============================================================
# Stage 3: Seed into Supabase
# ============================================================

def seed_concepts_to_supabase(
    concepts: list[dict],
    dept_code: str,
    subject_name: str,
    semester: int,
    branch: str,
    dry_run: bool = False,
) -> dict:
    """
    Upserts concepts into the concept_clusters table.
    Returns stats dict {inserted, linked, errors}.
    """
    stats = {"inserted": 0, "linked": 0, "errors": 0}
    inserted_map: dict[str, str] = {}  # concept_name -> UUID
    
    if dry_run:
        print(f"\n    📋 DRY RUN — Would seed {len(concepts)} concepts for [{dept_code}] {subject_name} (Sem {semester})")
        for c in concepts:
            tier_emoji = {"foundational": "🟢", "intermediate": "🟡", "advanced": "🔴"}.get(c["difficulty_tier"], "⚪")
            parent_str = f" ← {c['parent_concept_name']}" if c.get("parent_concept_name") else ""
            print(f"      {tier_emoji} M{c['module_number']}: {c['concept_name']}{parent_str}")
        stats["inserted"] = len(concepts)
        return stats
    
    # Phase 1: Insert all concepts (without parent links)
    for concept in concepts:
        subject_slug = re.sub(r'[^a-z0-9]+', '-', subject_name.lower()).strip('-')
        mu_code = f"mu-{dept_code.lower()}-s{semester}-{subject_slug}"
        
        row = {
            "concept_name": concept["concept_name"],
            "branch": branch,
            "subject": subject_name,
            "semester": semester,
            "module_number": concept["module_number"],
            "difficulty_tier": concept["difficulty_tier"],
            "department_code": dept_code,
            "mu_syllabus_code": mu_code,
        }
        
        try:
            response = get_supabase().table("concept_clusters").upsert(
                row,
                on_conflict="concept_name,subject,semester,department_code"
            ).execute()
            
            if response.data and len(response.data) > 0:
                row_id = response.data[0]["id"]
                inserted_map[concept["concept_name"]] = row_id
                stats["inserted"] += 1
            else:
                print(f"      ⚠️  No data returned for: {concept['concept_name']}")
        except Exception as e:
            print(f"      ❌ Failed: {concept['concept_name']} — {e}")
            stats["errors"] += 1
    
    # Phase 2: Link parent_concept_id
    for concept in concepts:
        parent_name = concept.get("parent_concept_name")
        if not parent_name:
            continue
        
        child_id = inserted_map.get(concept["concept_name"])
        parent_id = inserted_map.get(parent_name)
        
        if child_id and parent_id:
            try:
                get_supabase().table("concept_clusters").update(
                    {"parent_concept_id": parent_id}
                ).eq("id", child_id).execute()
                stats["linked"] += 1
            except Exception as e:
                print(f"      ❌ Link failed: {concept['concept_name']} → {parent_name} — {e}")
    
    return stats


# ============================================================
# Main Pipeline
# ============================================================

async def run_pipeline(
    dept_filter: str | None = None,
    sem_filter: int | None = None,
    from_pdf: bool = False,
    dry_run: bool = False,
):
    """Execute the full ingestion pipeline."""
    from services.llm_service import APIKeyManager
    
    print("=" * 65)
    print("  ASCEND Bulk Ingestion Pipeline")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)
    
    # Initialize key manager
    key_manager = APIKeyManager()
    print(f"\n🔑 API Keys loaded: {key_manager.count}")
    
    # Determine which departments to process
    depts = [dept_filter] if dept_filter else list(DEPARTMENT_CONFIG.keys())
    
    grand_total = {"concepts": 0, "subjects": 0, "linked": 0, "errors": 0}
    
    for dept_code in depts:
        config = DEPARTMENT_CONFIG[dept_code]
        sem_dict = config["semesters"]  # {3: "file.pdf", 4: "file.pdf"}
        
        # Filter semesters if --sem flag provided
        target_sems = {sem_filter: sem_dict[sem_filter]} if sem_filter and sem_filter in sem_dict else sem_dict
        
        print(f"\n{'─' * 60}")
        print(f"📚 Department: {dept_code} | Branch: {config['branch']}")
        print(f"   Semesters: {list(target_sems.keys())}")
        print(f"{'─' * 60}")
        
        for sem_num, pdf_file in target_sems.items():
            print(f"\n  📄 Semester {sem_num} — {pdf_file}")
            
            # Try loading existing result JSON first
            all_subjects = load_result_json(pdf_file)
            
            # If no result JSON exists, auto-extract from PDF
            if not all_subjects:
                pdf_path = PDF_DIR / pdf_file
                if not pdf_path.exists():
                    print(f"    ❌ PDF not found: {pdf_path}")
                    continue
                
                print(f"    📄 Extracting from PDF → JSON...")
                all_subjects = await extract_pdf_to_json(
                    pdf_path, pdf_file, key_manager
                )
                if not all_subjects:
                    print(f"    ⚠️  No subjects extracted from {pdf_file}")
                    continue
            
            print(f"    📖 Found {len(all_subjects)} subjects")
            
            for subject_data in all_subjects:
                subject_name = subject_data.get("subject_name", "").strip()
                raw_semester = subject_data.get("semester")
                semester = parse_semester(raw_semester) or sem_num
            
                # Skip unknown/empty subjects (Gemini failed to identify the subject)
                if not subject_name or subject_name.lower() == "unknown":
                    print(f"\n    ⏭️  Skipping unidentified subject")
                    continue
                
                # Skip non-theory subjects
                if not is_theory_subject(subject_name):
                    print(f"\n    ⏭️  Skipping non-theory: {subject_name}")
                    continue
                
                print(f"\n    🎯 [{dept_code}] {subject_name} (Sem {semester})")
                
                # Normalize module numbers in the source data
                for mod in subject_data.get("modules", []):
                    raw_mod_num = mod.get("module_number", "")
                    normalized = normalize_module_number(raw_mod_num)
                    if normalized:
                        mod["module_number"] = str(normalized)
                    
                    # Filter out null/empty topic titles
                    if "topics" in mod:
                        mod["topics"] = [
                            t for t in mod["topics"]
                            if t.get("title") and t["title"].strip()
                        ]
                
                # Check for cached concepts JSON first
                concepts_cache_path = RESULTS_DIR / f"{dept_code}_sem{semester}_{subject_name.lower().replace(' ', '_')}_concepts.json"
                if concepts_cache_path.exists():
                    with open(concepts_cache_path, 'r') as f:
                        cached = json.load(f)
                    concepts = cached.get("concepts", [])
                    print(f"      📦 Loaded {len(concepts)} concepts from cache (no Gemini call)")
                else:
                    # Extract concepts via LLM
                    print(f"      🤖 Extracting concepts via Gemini...")
                    concepts = await extract_concepts_for_subject(
                        subject_data, dept_code, key_manager
                    )
                
                if not concepts:
                    print(f"      ⚠️  No concepts extracted for {subject_name}")
                    continue
                
                # Filter out module 0 (prerequisite/review sections — not real course content)
                before_count = len(concepts)
                concepts = [c for c in concepts if c.get("module_number", 0) >= 1]
                dropped = before_count - len(concepts)
                if dropped:
                    print(f"      🧹 Dropped {dropped} prerequisite concepts (module 0)")
                
                print(f"      📊 Extracted {len(concepts)} concepts")
                
                # Save concepts JSON for reference
                concepts_output_path = RESULTS_DIR / f"{dept_code}_sem{semester}_{subject_name.lower().replace(' ', '_')}_concepts.json"
                with open(concepts_output_path, 'w') as f:
                    json.dump({
                        "department": dept_code,
                        "subject": subject_name,
                        "semester": semester,
                        "concepts": concepts,
                        "generated_at": datetime.now().isoformat(),
                    }, f, indent=2)
                print(f"      💾 Saved to {concepts_output_path.name}")
                
                # Seed to Supabase
                print(f"      🌱 Seeding to concept_clusters...")
                stats = seed_concepts_to_supabase(
                    concepts=concepts,
                    dept_code=dept_code,
                    subject_name=subject_name,
                    semester=semester,
                    branch=config["branch"],
                    dry_run=dry_run,
                )
                
                grand_total["concepts"] += stats["inserted"]
                grand_total["subjects"] += 1
                grand_total["linked"] += stats["linked"]
                grand_total["errors"] += stats["errors"]
                
                print(f"      ✅ {stats['inserted']} inserted, {stats['linked']} linked, {stats['errors']} errors")
                
                # Respect RPM between subjects
                if not dry_run:
                    await asyncio.sleep(RPM_DELAY)
    
    # Summary
    print(f"\n{'=' * 65}")
    print(f"  ✅ Pipeline Complete!")
    print(f"     Subjects processed: {grand_total['subjects']}")
    print(f"     Concepts seeded:    {grand_total['concepts']}")
    print(f"     Parent links:       {grand_total['linked']}")
    print(f"     Errors:             {grand_total['errors']}")
    print(f"     Finished:           {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'=' * 65}")


# ============================================================
# CLI Entry Point
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="ASCEND Bulk Ingestion Pipeline — Seed concept_clusters from syllabus data"
    )
    parser.add_argument(
        "--dept", type=str, default=None,
        choices=list(DEPARTMENT_CONFIG.keys()),
        help="Process a single department (default: all)"
    )
    parser.add_argument(
        "--sem", type=int, default=None,
        help="Process a single semester (default: all configured)"
    )
    parser.add_argument(
        "--from-pdf", action="store_true",
        help="Re-extract from PDFs instead of using existing result JSONs"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview what would be seeded without writing to the database"
    )
    
    args = parser.parse_args()
    asyncio.run(run_pipeline(
        dept_filter=args.dept,
        sem_filter=args.sem,
        from_pdf=args.from_pdf,
        dry_run=args.dry_run,
    ))


if __name__ == "__main__":
    main()
