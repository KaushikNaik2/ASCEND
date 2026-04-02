from pydantic import BaseModel, Field
from typing import List

class PrerequisiteTopic(BaseModel):
    topic_name: str = Field(..., description="The exact name of the foundational concept.")
    relevance: str = Field(..., description="Briefly explain why this is required to understand the target syllabus.")

class PrerequisiteResponse(BaseModel):
    prerequisites: List[PrerequisiteTopic] = Field(
        ..., 
        description="A list of 5 to 10 core prerequisite topics the student should already know."
    )