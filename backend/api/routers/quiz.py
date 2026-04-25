from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.llm_service import generate_adaptive_quiz  # Used by legacy /generate endpoint
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
    subject_id: str = Query(None, description="Filter by subject (e.g., 'data-structures-algorithms')"),
    branch_name: str = Query(None, description="Filter by branch ('Core', 'Computing', 'Specialized')"),
):
    try:
        # 1. Math computation: Get current score, aim for the sweet spot (+0.15)
        current_data = db.get_user_topic_score(user_id, topic_name)
        current_score = current_data.get("proficiency_score", 0.1) if current_data else 0.1
        target_difficulty = scorer.get_target_difficulty(current_score)
        
        print(f"🎯 Target Difficulty for '{topic_name}' is {target_difficulty} (Current: {current_score})")

        # 2. Try Vector Search with structured filters
        questions = []
        try:
            topic_embedding = await embedder.get_embedding(topic_name)
            rpc_params = {
                "query_embedding": topic_embedding,
                "match_threshold": 0.70,
                "match_count": 10,
                "target_difficulty": target_difficulty,
            }
            # Pass structured filters if provided
            if subject_id:
                rpc_params["filter_subject_id"] = subject_id
            if branch_name:
                rpc_params["filter_branch_name"] = branch_name

            response = db.client.rpc(
                "match_quiz_questions",
                rpc_params
            ).execute()
            questions = response.data if hasattr(response, 'data') else []
            print(f"📡 Vector DB returned {len(questions)} matching questions.")
        except Exception as vec_err:
            print(f"⚠️ Vector search skipped (embedding unavailable): {vec_err}")
            questions = []

        # 3. Pre-populated DB is the ONLY source of questions
        #    (Run `python -m scripts.batch_gen` to populate)
        if not questions or len(questions) < 5:
            raise HTTPException(
                status_code=404,
                detail=f"Insufficient questions for '{topic_name}'. Run batch_gen.py to populate the question bank."
            )

        # 4. Return matched questions from pre-populated DB
        return {"questions": questions, "source": "vector_db"}

    except Exception as e:
        print(f"❌ Adaptive Routing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



class QuizSubmission(BaseModel):
    user_id: str
    subject_id: str
    topic_name: str
    question_difficulty: float
    is_correct: bool

@router.post("/submit")
async def submit_quiz_answer(payload: QuizSubmission):
    """
    Grades a single answer and updates the user's permanent proficiency vector.
    """
    # 1. Fetch current score from DB
    # (Default to 0.1 if new topic)
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

    # Resolve the true subject_id (golden_syllabus_id) from the plan_id
    plan_details = db.get_plan_details(payload.subject_id)
    actual_subject_id = plan_details.get("golden_syllabus_id") if plan_details else payload.subject_id

    # 4. Persistence: Update the DB
    try:
        db.update_user_proficiency(
            user_id=payload.user_id,
            topic_name=payload.topic_name,
            new_score=new_score,
            is_mastered=is_mastered,
            subject_id=actual_subject_id
        )
        
        # 5. Auto-sync progress_state on the roadmap so Knowledge Graph updates!
        if new_score >= 0.90:
            progress_status = "done"
        elif new_score >= 0.3:
            progress_status = "ongoing"
        else:
            progress_status = "pending"
        
        try:
            db.update_topic_status(
                user_id=payload.user_id,
                plan_id=payload.subject_id,  # subject_id is actually plan_id from frontend
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