# backend/scripts/batch_gen.py
"""
Offline Batch Generation Pipeline — Populates `quiz_questions` from the
Universal Concept Graph (concept_clusters) using Gemini + cross-model
verification + API key rotation.

Usage:
    cd backend
    python -m scripts.batch_gen                           # All concepts
    python -m scripts.batch_gen --subject "Operating System"
    python -m scripts.batch_gen --dept COMPS              # Single department
    python -m scripts.batch_gen --dept MECH --subject "Thermodynamics"
"""

import os
import sys
import json
import asyncio
import argparse
import time
import re
from pathlib import Path
from datetime import datetime
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from supabase import create_client, Client
from langchain_google_genai import ChatGoogleGenerativeAI
from services.embedding_service import EmbeddingEngine
from schemas.quiz import AdaptiveQuizResponse
from core.templates import get_adaptive_quiz_prompt

# ============================================================
# API Key Rotation Manager
# ============================================================

class APIKeyManager:
    """Round-robin key rotation with cooldown tracking."""
    
    def __init__(self):
        self.keys = []
        for suffix in ["_A", "_B", "_C", ""]:
            key = os.getenv(f"GOOGLE_API_KEY{suffix}")
            if key:
                self.keys.append(key)
        # Deduplicate while preserving order
        seen = set()
        self.keys = [k for k in self.keys if not (k in seen or seen.add(k))]
        self.index = 0
        self.cooldowns: dict[str, float] = {}
        self.cooldown_duration = 60  # seconds
    
    def get_next_key(self) -> str:
        """Get next available key via round-robin, skipping cooled-down keys."""
        if not self.keys:
            raise RuntimeError("No API keys configured")
        
        for _ in range(len(self.keys)):
            key = self.keys[self.index % len(self.keys)]
            self.index += 1
            
            # Check cooldown
            if key in self.cooldowns:
                if time.time() - self.cooldowns[key] < self.cooldown_duration:
                    continue
                else:
                    del self.cooldowns[key]
            return key
        
        # All keys on cooldown — wait for the oldest to expire
        oldest_key = min(self.cooldowns, key=self.cooldowns.get)
        wait_time = self.cooldown_duration - (time.time() - self.cooldowns[oldest_key])
        if wait_time > 0:
            print(f"    ⏳ All keys cooling down. Waiting {wait_time:.0f}s...")
            time.sleep(wait_time)
        del self.cooldowns[oldest_key]
        return oldest_key
    
    def mark_cooling(self, key: str):
        """Mark a key as rate-limited."""
        self.cooldowns[key] = time.time()
        remaining = len(self.keys) - len(self.cooldowns)
        print(f"    🔑 Key rotated to cooldown ({remaining} active keys remaining)")


# ============================================================
# Config
# ============================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("🚨 Missing env vars. Need SUPABASE_URL, SUPABASE_KEY.")
    sys.exit(1)

key_manager = APIKeyManager()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
embedder = EmbeddingEngine()

QUESTIONS_PER_CLUSTER = 10
# With 4 keys rotating, effective RPM = 60. 60/60 = 1.0s minimum.
RPM_DELAY = 1.0
FAST_MODE = False  # Set via --fast CLI flag


def make_llm(temperature: float = 0.3) -> ChatGoogleGenerativeAI:
    """Create a fresh LLM instance with a rotated API key."""
    api_key = key_manager.get_next_key()
    return ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview",
        temperature=temperature,
        api_key=api_key,
    )


# ============================================================
# Core Pipeline
# ============================================================

def fetch_concept_clusters(subject_filter: str = None, dept_filter: str = None) -> list[dict]:
    """Fetch concept clusters from Supabase, optionally filtered."""
    query = supabase.table("concept_clusters").select("*").order("subject").order("module_number")
    if subject_filter:
        query = query.ilike("subject", f"%{subject_filter}%")
    if dept_filter:
        query = query.eq("department_code", dept_filter.upper())
    response = query.execute()
    return response.data or []


def group_by_subject_module(concepts: list[dict]) -> dict[str, list[dict]]:
    """Group concepts by subject → module for batched generation."""
    groups: dict[str, list[dict]] = {}
    for c in concepts:
        key = f"{c['subject']}::Module {c.get('module_number', '?')}"
        groups.setdefault(key, []).append(c)
    return groups


def build_topics_md(concepts: list[dict]) -> str:
    """Convert a list of concept dicts into Markdown for the quiz prompt."""
    subject = concepts[0]["subject"] if concepts else "Unknown"
    module = concepts[0].get("module_number", "?") if concepts else "?"
    
    md = f"# Subject: {subject}\n"
    md += f"## Module {module}\n\n"
    for c in concepts:
        tier = c.get("difficulty_tier", "foundational")
        md += f"- {c['concept_name']} [{tier}]\n"
    return md


def fetch_existing_concepts(subject: str) -> set[str]:
    """Checkpoint: Fetch concepts that already have questions in the DB."""
    try:
        response = supabase.table("quiz_questions") \
            .select("primary_concept") \
            .eq("subject_id", subject.lower().replace(" ", "-")) \
            .execute()
        return {row["primary_concept"] for row in (response.data or [])}
    except Exception as e:
        print(f"  ⚠️ Checkpoint query failed (non-fatal): {e}")
        return set()


@retry(wait=wait_exponential(min=2, max=30), stop=stop_after_attempt(3), retry=retry_if_exception_type(Exception))
async def generate_questions_for_cluster(
    concepts: list[dict],
    num_questions: int = QUESTIONS_PER_CLUSTER
) -> list[dict]:
    """Generate quiz questions for a concept cluster via Gemini with key rotation."""
    topics_md = build_topics_md(concepts)
    
    # Build a neutral proficiency map (0.5 for all topics → balanced difficulty)
    proficiency_map = {c["concept_name"]: 0.5 for c in concepts}
    proficiency_context = (
        f"ACTIVE LEARNING TOPICS (Generate balanced questions):\n"
        f"{json.dumps(proficiency_map, indent=2)}\n\n"
        f"MASTERED / COMPLETED TOPICS:\n{{}}"
    )
    
    # 🔑 Fresh LLM with rotated key for each call
    gen_llm = make_llm(temperature=0.3)
    structured_llm = gen_llm.with_structured_output(AdaptiveQuizResponse)
    quiz_prompt = get_adaptive_quiz_prompt()
    chain = quiz_prompt | structured_llm
    
    response = await chain.ainvoke({
        "user_proficiency": proficiency_context,
        "target_topics_md": topics_md,
        "num_questions": num_questions,
    })
    
    return response.questions if response else []


@retry(wait=wait_exponential(min=2, max=30), stop=stop_after_attempt(3), retry=retry_if_exception_type(Exception))
async def verify_questions(questions: list, subject: str) -> list[dict]:
    """
    Cross-model verification: Ask a separate LLM call to validate
    academic accuracy. Returns flagged question indices.
    """
    if not questions:
        return []

    questions_text = "\n".join([
        f"Q{i+1}: {q.question_text} | Answer: {q.correct_option} | Concept: {q.primary_concept}"
        for i, q in enumerate(questions)
    ])

    verification_prompt = f"""You are an academic quality auditor for Mumbai University Engineering.
    
Subject: {subject}

Review these quiz questions for academic accuracy:
{questions_text}

For each question, respond with ONLY a JSON array of objects:
[{{"index": 1, "valid": true/false, "reason": "brief reason if invalid"}}]

Rules:
- Mark valid=false ONLY if the correct answer is factually wrong or the question is ambiguous.
- Be lenient on phrasing; focus on factual correctness.
"""
    try:
        # 🔑 Fresh LLM with rotated key
        verify_llm = make_llm(temperature=0.0)
        result = await verify_llm.ainvoke(verification_prompt)
        content = result.content if hasattr(result, 'content') else str(result)
        
        # Try to parse JSON from the response
        start = content.find("[")
        end = content.rfind("]") + 1
        if start >= 0 and end > start:
            verdicts = json.loads(content[start:end])
            flagged = [v for v in verdicts if not v.get("valid", True)]
            return flagged
    except Exception as e:
        if "429" in str(e):
            key_manager.mark_cooling(key_manager.keys[(key_manager.index - 1) % len(key_manager.keys)])
            raise  # Let tenacity retry with a new key
        print(f"  ⚠️ Verification parse error (non-fatal): {e}")
    
    return []


async def embed_and_save(questions: list, concepts: list[dict], flagged_indices: list[dict]):
    """Embed each question and save to quiz_questions table."""
    subject = concepts[0]["subject"] if concepts else "Unknown"
    branch = concepts[0]["branch"] if concepts else "Computing"
    dept_code = concepts[0].get("department_code", "COMPS") if concepts else "COMPS"
    flagged_set = {f["index"] for f in flagged_indices}
    saved = 0

    for i, q in enumerate(questions):
        # Skip flagged questions
        if (i + 1) in flagged_set:
            print(f"  🚫 Skipping flagged Q{i+1}: {q.primary_concept}")
            continue

        try:
            # Generate embedding from question text + concept
            embed_text = f"{q.question_text} | {q.primary_concept}"
            embedding = await embedder.get_embedding(embed_text)

            row = {
                "question_text": q.question_text,
                "options": json.loads(json.dumps([opt.model_dump() for opt in q.options])),
                "correct_option": q.correct_option,
                "explanation": q.explanation,
                "primary_concept": q.primary_concept,
                "embedding": embedding,
                "metadata": json.loads(json.dumps({
                    "difficulty": q.difficulty_level,
                    "format": q.question_format,
                    "bloom": q.blooms_taxonomy_level,
                    "estimated_time": q.estimated_time_seconds,
                    "secondary_concepts": q.secondary_concepts,
                })),
                "subject_id": subject.lower().replace(" ", "-"),
                "branch_name": branch,
            }

            supabase.table("quiz_questions").insert(row).execute()
            saved += 1
        except Exception as e:
            print(f"  ❌ Save failed for Q{i+1}: {e}")

    return saved


# ============================================================
# Main Pipeline
# ============================================================

async def run_pipeline(subject_filter: str = None, dept_filter: str = None):
    """Execute the full batch generation pipeline."""
    start_time = datetime.now()
    print("=" * 60)
    print("  ASCEND Batch Question Generation Pipeline")
    print(f"  Started: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  🔑 API Keys: {len(key_manager.keys)} loaded")
    if dept_filter:
        print(f"  🏷️ Department: {dept_filter.upper()}")
    if subject_filter:
        print(f"  📚 Subject: {subject_filter}")
    print("=" * 60)

    # 1. Fetch concepts
    concepts = fetch_concept_clusters(subject_filter, dept_filter)
    if not concepts:
        print(f"🚨 No concepts found. Run ingest_pipeline.py first.")
        return

    print(f"\n📚 Found {len(concepts)} concepts across {len(set(c['subject'] for c in concepts))} subjects.")

    # 2. Group by subject+module
    groups = group_by_subject_module(concepts)
    total_groups = len(groups)
    total_saved = 0
    total_flagged = 0
    total_skipped = 0
    total_errors = 0

    for idx, (group_key, group_concepts) in enumerate(groups.items(), 1):
        subject = group_concepts[0]["subject"]
        dept = group_concepts[0].get("department_code", "?")
        print(f"\n[{idx}/{total_groups}] 🎯 [{dept}] {group_key} ({len(group_concepts)} concepts)")

        # 2.5 Checkpoint: Skip clusters where all concepts already have questions
        existing = fetch_existing_concepts(subject)
        remaining_concepts = [c for c in group_concepts if c["concept_name"] not in existing]
        if not remaining_concepts:
            print(f"  ⏭️  All concepts already populated. Skipping.")
            total_skipped += len(group_concepts)
            continue
        if len(remaining_concepts) < len(group_concepts):
            skipped = len(group_concepts) - len(remaining_concepts)
            print(f"  📋 Checkpoint: {skipped} already done. Generating for {len(remaining_concepts)}.")
            group_concepts = remaining_concepts

        # 3. Generate questions
        num_q = 5 if FAST_MODE else QUESTIONS_PER_CLUSTER
        try:
            questions = await generate_questions_for_cluster(group_concepts, num_q)
            print(f"  📝 Generated {len(questions)} questions")
        except Exception as e:
            # Surface the root cause from RetryError wrapper
            root = e.__cause__ or e
            if hasattr(root, '__cause__') and root.__cause__:
                root = root.__cause__
            if "429" in str(root):
                key_manager.mark_cooling(key_manager.keys[(key_manager.index - 1) % len(key_manager.keys)])
            print(f"  ❌ Generation failed: {root}")
            total_errors += 1
            await asyncio.sleep(RPM_DELAY)
            continue

        # 4. Cross-model verification
        await asyncio.sleep(RPM_DELAY)
        try:
            flagged = await verify_questions(questions, subject)
            if flagged:
                print(f"  ⚠️ {len(flagged)} questions flagged by verifier")
                total_flagged += len(flagged)
            else:
                print(f"  ✅ All questions passed verification")
        except Exception as e:
            print(f"  ⚠️ Verification skipped: {e}")
            flagged = []

        # 5. Embed and save
        await asyncio.sleep(RPM_DELAY)
        saved = await embed_and_save(questions, group_concepts, flagged)
        total_saved += saved
        print(f"  💾 Saved {saved} questions to quiz_questions")

        # Rate limit between groups
        if idx < total_groups:
            await asyncio.sleep(RPM_DELAY)

    # Summary
    end_time = datetime.now()
    elapsed = (end_time - start_time).total_seconds()
    print("\n" + "=" * 60)
    print(f"  ✅ Pipeline Complete!")
    print(f"     Total saved:    {total_saved}")
    print(f"     Total flagged:  {total_flagged}")
    print(f"     Skipped (done): {total_skipped}")
    print(f"     Errors:         {total_errors}")
    print(f"     Duration:       {elapsed:.0f}s ({elapsed/60:.1f}min)")
    print(f"     Finished:       {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="ASCEND Batch Question Generator")
    parser.add_argument("--subject", type=str, default=None,
                        help="Filter by subject name (e.g., 'Operating System')")
    parser.add_argument("--dept", type=str, default=None,
                        help="Filter by department code (e.g., COMPS, IT, MECH)")
    parser.add_argument("--fast", action="store_true",
                        help="Fast mode: 5 Qs/cluster, skip verification")
    args = parser.parse_args()
    
    global FAST_MODE
    if args.fast:
        FAST_MODE = True
        print("⚡ FAST MODE: 5 questions/cluster, verification skipped")
    
    asyncio.run(run_pipeline(args.subject, args.dept))


if __name__ == "__main__":
    main()
