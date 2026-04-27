# backend/schemas/mapping.py
"""
Pydantic schemas for the Syllabus Mapping Mode (Step 4).
Used when the LLM acts as a Scope Detector, mapping uploaded
syllabus modules to pre-existing Truth Layer concepts.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class ConceptMapping(BaseModel):
    """A single mapping between uploaded syllabus text and a Truth Layer concept."""
    syllabus_text: str = Field(..., description="The exact text/topic from the uploaded syllabus.")
    matched_concept: str = Field(
        ...,
        description="The concept_name from the Truth Layer that best matches. Use 'UNMAPPED' if no match."
    )
    confidence: float = Field(
        ...,
        description="Confidence score from 0.0 to 1.0 for this mapping.",
        ge=0.0,
        le=1.0,
    )
    module_context: Optional[str] = Field(
        None,
        description="The module name/number this topic belongs to in the uploaded syllabus."
    )


class SyllabusMappingResponse(BaseModel):
    """Full mapping result for an uploaded syllabus."""
    subject_detected: str = Field(..., description="The subject name detected from the uploaded text.")
    total_topics: int = Field(..., description="Total number of topics found in the uploaded text.")
    mappings: List[ConceptMapping] = Field(..., description="List of topic-to-concept mappings.")
    unmapped_count: int = Field(
        default=0,
        description="Number of topics that could not be mapped to the Truth Layer."
    )
    coverage_score: float = Field(
        default=0.0,
        description="Percentage of topics successfully mapped (0.0 to 1.0).",
        ge=0.0,
        le=1.0,
    )
