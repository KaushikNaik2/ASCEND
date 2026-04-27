# backend/schemas/concept.py
"""Pydantic models for LLM-generated concept cluster data."""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class ConceptEntry(BaseModel):
    concept_name: str = Field(..., description="Atomic concept name, e.g. 'Binary Search Tree'")
    module_number: int = Field(..., description="Integer module number (1-7)")
    difficulty_tier: Literal["foundational", "intermediate", "advanced"] = Field(
        ..., description="Difficulty classification"
    )
    parent_concept_name: Optional[str] = Field(
        None,
        description="Name of the parent/prerequisite concept within the same subject. Null if root concept."
    )


class ConceptExtractionResponse(BaseModel):
    subject_name: str = Field(..., description="Full subject name exactly as it appears in the syllabus")
    concepts: List[ConceptEntry] = Field(..., description="List of atomic concepts extracted from the syllabus")
