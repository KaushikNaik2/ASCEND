from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.llm_service import generate_adaptive_quiz
from services.database_service import db
from services.embedding_service import embedder
from core.scoring import scorer

router = APIRouter(
    prefix="/quiz",
    tags=["Adaptive Quiz"]
)

# 1. Define the Expected Request Body (Legacy)
class QuizGenerationRequest(BaseModel):
    user_proficiency_map: Dict[str, float]
    target_topics_md: str
    num_questions: int = 10

# 2. The Legacy Generation Endpoint (Unused heavily now)
@router.post("/generate")
async def generate_quiz(payload: QuizGenerationRequest):
    """
    Takes the user's current proficiency vector and target Markdown syllabus,
    then generates a highly personalized adaptive assessment.
    """
    try:
        quiz_response = await generate_adaptive_quiz(
            user_proficiency_map=payload.user_proficiency_map,
            target_topics_md=payload.target_topics_md,
            num_questions=payload.num_questions
        )
        return quiz_response
    except Exception as e:
        print(f"❌ Quiz Generation Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate adaptive quiz.")

# 3. The New Adaptive RAG Endpoint!
@router.get("/adaptive")
async def get_adaptive_quiz(
    user_id: str = Query(..., description="ID of the user taking the quiz"),
    plan_id: str = Query(..., description="ID of the user study plan"),
    topic_name: str = Query(..., description="The name of the target topic"),
    subject_id: str = Query(..., description="Required. Filter by subject (e.g., 'data-structures-algorithms')"),
    branch_name: str = Query(None, description="Filter by branch ('Core', 'Computing', 'Specialized')"),
):
    # FIX #1: UNMAPPED Guard — block any topic not in the Truth Layer
    if not topic_name or topic_name.strip().upper() == "UNMAPPED":
        raise HTTPException(
            status_code=400,
            detail="Cannot quiz on UNMAPPED topics. This concept is out of scope for your syllabus."
        )
    try:
        # 1. Math computation: Get current score, aim for the sweet spot (+0.15)
        current_data = db.get_user_topic_score(user_id, topic_name)
        current_score = current_data.get("proficiency_score", 0.1) if current_data else 0.1
        target_difficulty = scorer.get_target_difficulty(current_score)
        
        print(f"🎯 Target Difficulty for '{topic_name}' is {target_difficulty} (Current: {current_score})")

        # FIX: Normalize subject_id to slug format (matches batch_gen.py storage)
        normalized_subject = subject_id.lower().replace(" ", "-") if subject_id else ""
        
        # 🛡️ ANTIGRAVITY SLUG FIX: Generic parent slugs (e.g. "first-year-engineering-...")
        # don't match any real subject folder in the question bank. Drop the filter for these.
        is_generic_slug = any(
            normalized_subject.startswith(prefix) 
            for prefix in ["first-year", "second-year", "third-year", "fourth-year", "fe-", "se-", "te-", "be-"]
        )

        # 2. Try Vector Search with structured filters
        questions = []
        try:
            topic_embedding = await embedder.get_embedding(topic_name)
            rpc_params = {
                "query_embedding": topic_embedding,
                "match_threshold": 0.65,
                "match_count": 10,
                "target_difficulty": target_difficulty,
            }
            
            # Only apply subject filter if it's a specific subject slug, not a generic year
            if normalized_subject and not is_generic_slug:
                rpc_params["filter_subject_id"] = normalized_subject
                
            if branch_name:
                rpc_params["filter_branch_name"] = branch_name

            response = db.client.rpc(
                "match_quiz_questions",
                rpc_params
            ).execute()
            questions = response.data if hasattr(response, 'data') else []
            print(f"📡 Vector DB returned {len(questions)} matching questions (subject filter: {'NONE (generic)' if is_generic_slug else normalized_subject}).")
            
        except Exception as vec_err:
            print(f"⚠️ Vector search skipped (embedding unavailable): {vec_err}")
            questions = []

        # 3. DOCTRINE #3 FIREWALL: Deterministic RAG only. Threshold = 2 for sparse topics.
        MIN_QUESTIONS = 2
        if questions and len(questions) >= MIN_QUESTIONS:
            return {"questions": questions, "source": "vector_db"}

        # Hard fail — question bank is empty for this topic
        print(f"🚫 FIREWALL: {len(questions)} questions found for '{topic_name}' (subject: {normalized_subject}). Need {MIN_QUESTIONS}+. Run batch_gen.py.")
        raise HTTPException(
            status_code=404,
            detail=f"Question bank has {len(questions)} questions for '{topic_name}'. Run: python -m scripts.batch_gen --subject \"{subject_id}\""
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Adaptive Routing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class QuizSubmission(BaseModel):
    user_id: str
    plan_id: str     # FIX #2: UUID of user_study_plans row
    subject_id: str  # FIX #2: slug like 'data-structures-algorithms'
    topic_name: str
    question_difficulty: float
    is_correct: bool

@router.post("/submit")
async def submit_quiz_answer(payload: QuizSubmission):
    """
    Grades a single answer and updates the user's permanent proficiency vector.
    plan_id  = UUID of the user's study plan (for roadmap sync)
    subject_id = slug like 'data-structures-algorithms' (for proficiency storage)
    """
    # 1. Fetch current score from DB
    current_data = db.get_user_topic_score(payload.user_id, payload.topic_name)
    current_score = current_data.get("proficiency_score", 0.1) if current_data else 0.1

    # 2. Run the Bounded Weighted Delta math
    new_score = scorer.calculate_new_state(
        current_proficiency=current_score,
        question_difficulty=payload.question_difficulty,
        is_correct=payload.is_correct
    )

    # 3. Check for Mastery Flag (0.90 Threshold)
    is_mastered = new_score >= 0.90

    # 🛡️ ANTIGRAVITY UPDATE GUARD: Clean subject_id to match Truth Layer slugs
    # "First Year Engineering (Semester I & II)" → "first-year-engineering"
    raw = payload.subject_id or ""
    clean_subject_id = raw.split("(")[0].strip().lower().replace(" ", "-").rstrip("-")

    # 4. Persistence: Update the DB with slugified subject_id
    try:
        db.update_user_proficiency(
            user_id=payload.user_id,
            topic_name=payload.topic_name,
            new_score=new_score,
            is_mastered=is_mastered,
            subject_id=clean_subject_id
        )
        
        # 5. Auto-sync progress_state on the roadmap
        if new_score >= 0.90:
            progress_status = "done"
        elif new_score >= 0.3:
            progress_status = "ongoing"
        else:
            progress_status = "pending"
        
        try:
            db.update_topic_status(
                user_id=payload.user_id,
                plan_id=payload.plan_id,  # FIX #2: proper plan_id now
                topic_title=payload.topic_name,
                status=progress_status
            )
            print(f"📊 Progress synced: '{payload.topic_name}' → {progress_status} (score: {new_score:.2f})")
        except Exception as sync_err:
            print(f"⚠️ Progress sync failed (non-fatal): {sync_err}")
        
        return {
            "status": "updated",
            "old_score": current_score,
            "new_score": new_score,
            "mastery_achieved": is_mastered,
            "progress_status": progress_status
        }
    except Exception as e:
        print(f"❌ DB Update Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update proficiency.")


# ==========================================
# 4. Baseline Assessment (Knowledge Graph Ignition)
# ==========================================

@router.get("/baseline")
async def get_baseline_quiz(
    plan_id: str = Query(..., description="Study plan ID — baseline is scoped to mapped concepts"),
    subject_id: str = Query(..., description="Subject slug (e.g., 'data-structures-algorithms')"),
    num_questions: int = Query(10, description="Max questions to sample"),
):
    """
    FIX #3: Plan-Aware Baseline — only samples questions for concepts
    that are actually in the student's mapped syllabus.
    Falls back to subject-wide sampling if plan lookup fails.
    """
    try:
        # 1. Fetch the student's mapped concepts from their plan
        mapped_concepts = db.get_plan_mapped_concepts(plan_id)

        if mapped_concepts and len(mapped_concepts) >= 3:
            # Plan-aware: only pull questions matching mapped concepts
            response = db.client.table("quiz_questions") \
                .select("id, question_text, options, correct_option, explanation, metadata, primary_concept") \
                .eq("subject_id", subject_id) \
                .in_("primary_concept", mapped_concepts) \
                .limit(num_questions * 3) \
                .execute()
            
            # Deduplicate: pick 1 per concept
            seen_concepts = set()
            questions = []
            for q in (response.data or []):
                if q["primary_concept"] not in seen_concepts:
                    seen_concepts.add(q["primary_concept"])
                    questions.append(q)
                    if len(questions) >= num_questions:
                        break
        else:
            # Fallback: subject-wide sampling via RPC
            response = db.client.rpc("sample_baseline_questions", {
                "p_subject_id": subject_id,
                "p_limit": num_questions,
            }).execute()
            questions = response.data if hasattr(response, 'data') else []

        if len(questions) < 3:
            raise HTTPException(
                status_code=404,
                detail=f"Not enough questions for baseline on '{subject_id}'. Run batch_gen.py first."
            )

        return {"questions": questions, "source": "baseline_sample", "count": len(questions)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Baseline Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=f"Baseline quiz generation failed: {e}")


class BaselineAnswer(BaseModel):
    topic_name: str
    question_difficulty: float
    is_correct: bool

class BaselineSubmission(BaseModel):
    user_id: str
    subject_id: str
    plan_id: str
    answers: List[BaselineAnswer]

@router.post("/submit-baseline")
async def submit_baseline(payload: BaselineSubmission):
    """
    Bulk-processes baseline answers and initializes the proficiency vector.
    This is the IGNITION — after this, the Knowledge Graph has real data.
    """
    results = []

    for ans in payload.answers:
        # 1. Fetch current score (defaults to 0.1 for new topics)
        current_data = db.get_user_topic_score(payload.user_id, ans.topic_name)
        current_score = current_data.get("proficiency_score", 0.1) if current_data else 0.1

        # 2. Run the Bounded Weighted Delta math
        new_score = scorer.calculate_new_state(
            current_proficiency=current_score,
            question_difficulty=ans.question_difficulty,
            is_correct=ans.is_correct,
        )
        is_mastered = new_score >= 0.90

        # 3. Persist to user_topic_vectors
        try:
            db.update_user_proficiency(
                user_id=payload.user_id,
                subject_id=payload.subject_id,
                topic_name=ans.topic_name,
                new_score=new_score,
                is_mastered=is_mastered,
            )
        except Exception as e:
            print(f"⚠️ Baseline proficiency update failed for '{ans.topic_name}': {e}")

        # 4. Auto-sync roadmap progress state
        progress_status = "done" if new_score >= 0.90 else "ongoing" if new_score >= 0.3 else "pending"
        try:
            db.update_topic_status(payload.user_id, payload.plan_id, ans.topic_name, progress_status)
        except Exception:
            pass  # Non-fatal: roadmap sync is best-effort

        results.append({
            "topic": ans.topic_name,
            "score": new_score,
            "mastered": is_mastered,
            "progress": progress_status,
        })

    # 5. Mark baseline as completed — gates dashboard access
    db.mark_baseline_complete(payload.user_id, payload.subject_id)
    print(f"🔥 KNOWLEDGE GRAPH IGNITED for user {payload.user_id} on subject {payload.subject_id}")

    return {"status": "ignited", "topic_scores": results}