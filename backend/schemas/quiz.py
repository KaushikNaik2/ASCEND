from pydantic import BaseModel, Field
from typing import List, Optional

class PrerequisiteTopic(BaseModel):
    topic_name: str = Field(..., description="The exact name of the foundational concept.")
    relevance: str = Field(..., description="Briefly explain why this is required to understand the target syllabus.")

class PrerequisiteResponse(BaseModel):
    prerequisites: List[PrerequisiteTopic] = Field(
        ..., 
        description="A list of 5 to 10 core prerequisite topics the student should already know."
    )

class QuizOption(BaseModel):
    option_letter: str = Field(..., description="A, B, C, or D")
    option_text: str = Field(..., description="The text of the choice.")
    misconception_addressed: Optional[str] = Field(
        None, 
        description="If this is an incorrect option, what specific mathematical or logical fallacy does it represent? Null if this is the correct answer."
    )

class AdaptiveQuestion(BaseModel):
    question_text: str = Field(..., description="The actual question.")
    options: List[QuizOption] = Field(..., description="Exactly 4 multiple choice options.")
    correct_option: str = Field(..., description="The letter of the correct option (A, B, C, or D).")
    explanation: str = Field(..., description="Comprehensive explanation of the correct answer.")
    
    # --- ADVANCED VECTOR METADATA ---
    primary_concept: str = Field(..., description="The core atomic concept being tested.")
    secondary_concepts: List[str] = Field(
        default_factory=list, 
        description="List any other concepts required to solve this. Empty if it's a single-concept question."
    )
    difficulty_level: float = Field(..., description="A float from 0.0 (absolute beginner) to 1.0 (expert mastery).")
    blooms_taxonomy_level: str = Field(
        ..., 
        description="Must be exactly one of: 'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'."
    )
    question_format: str = Field(
        ..., 
        description="Strictly classify as: 'Theory', 'Numerical', or 'Formula'."
    )
    estimated_time_seconds: int = Field(
        ..., 
        description="Estimated time in seconds a student should need to solve this. Numericals should take longer than Theory."
    )

class AdaptiveQuizResponse(BaseModel):
    questions: List[AdaptiveQuestion] = Field(..., description="The array of personalized quiz questions.")