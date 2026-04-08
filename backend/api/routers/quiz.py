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
    topic_name: str = Query(..., description="The name of the target topic")
):
    try:
        # 1. Math computation: Get current score, aim for the sweet spot (+0.15)
        current_data = db.get_user_topic_score(user_id, topic_name)
        current_score = current_data.get("proficiency_score", 0.1) if current_data else 0.1
        target_difficulty = scorer.get_target_difficulty(current_score)
        
        print(f"🎯 Target Difficulty for '{topic_name}' is {target_difficulty} (Current: {current_score})")

        # 2. Vector Magic: Embed the topic string
        topic_embedding = await embedder.get_embedding(topic_name)
        
        # 3. Search Supabase via our custom RPC!
        response = db.client.rpc(
            "match_quiz_questions",
            {
                "query_embedding": topic_embedding,
                "match_threshold": 0.70, # Has to be somewhat related
                "match_count": 10,
                "target_difficulty": target_difficulty
            }
        ).execute()

        questions = response.data if hasattr(response, 'data') else []
        print(f"📡 Vector DB returned {len(questions)} matching questions.")

        # 4. RAG Fallback: Seed the database via LLM if cache is empty
        if not questions or len(questions) < 5:
            print("⚠️ Insufficient RAG cache. Falling back to Gemini to generate new questions...")
            
            # Use Gemini to generate brand new questions targeting this topic and exact difficulty
            quiz_response = await generate_adaptive_quiz(
                user_proficiency_map={topic_name: current_score}, # Force prompt to use this
                target_topics_md=topic_name,
                num_questions=10
            )

            new_questions = quiz_response.questions
            
            # Fetch Syllabus ID from the Plan to properly log the questions
            plan_details = db.get_plan_details(plan_id)
            syllabus_id = plan_details.get("golden_syllabus_id") if plan_details else None

            if syllabus_id:
                # Embed and save the new questions for the future!
                # We calculate embeddings in parallel heavily accelerating the flow
                for q in new_questions:
                    try:
                        q_embed = await embedder.get_embedding(q.question_text)
                        db.save_quiz_question_vector(
                            syllabus_id=syllabus_id,
                            question_data=q.model_dump(),
                            embedding=q_embed
                        )
                    except Exception as embed_e:
                        print(f"⚠️ Failed to embed/save question: {embed_e}")
                print(f"💾 Saved {len(new_questions)} new questions to pgvector!")
            
            # Map LLM response schemas to look exactly like the DB response schema
            mapped_responses = []
            for i, q in enumerate(new_questions):
                mapped_responses.append({
                    "id": f"llm-gen-{i}",
                    "question_text": q.question_text,
                    "options": [opt.model_dump() for opt in q.options],
                    "correct_option": q.correct_option,
                    "explanation": q.explanation,
                    "metadata": {
                        "difficulty": q.difficulty_level,
                        "format": q.question_format,
                        "bloom": q.blooms_taxonomy_level
                    },
                    "primary_concept": q.primary_concept
                })
            return {"questions": mapped_responses, "source": "gemini"}

        # 5. Perfect RAG hit: Return DB questions
        return {"questions": questions, "source": "vector_db"}

    except Exception as e:
        print(f"❌ Adaptive Routing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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