# api/routers/quiz.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from services.llm_service import generate_adaptive_quiz

router = APIRouter(
    prefix="/quiz",
    tags=["Adaptive Quiz"]
)

# 1. Define the Expected Request Body
class QuizGenerationRequest(BaseModel):
    user_proficiency_map: Dict[str, float]
    target_topics_md: str
    num_questions: int = 10

# 2. The Generation Endpoint
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

from core.scoring import scorer
from services.database_service import db

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

    # 4. Persistence: Update the DB
    try:
        db.update_user_proficiency(
            user_id=payload.user_id,
            topic_name=payload.topic_name,
            new_score=new_score,
            is_mastered=is_mastered,
            subject_id=payload.subject_id
        )
        
        return {
            "status": "updated",
            "old_score": current_score,
            "new_score": new_score,
            "mastery_achieved": is_mastered
        }
    except Exception as e:
        print(f"❌ DB Update Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update proficiency.")