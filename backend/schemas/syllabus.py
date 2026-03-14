from pydantic import BaseModel, Field
from typing import List, Optional

class SubTopic(BaseModel):
    title: str = Field(description="Name of the detailed topic or sub-topic")
    estimated_hours: Optional[str] = Field(description="Time required for this topic, if mentioned")

class Module(BaseModel):
    module_number: str = Field(description="The module number (e.g., 'Module 1')")
    title: str = Field(description="Title of the module")
    topics: List[SubTopic] = Field(description="List of sub-topics within this module")

class SyllabusResponse(BaseModel):
    subject_name: str = Field(description="Name of the subject or course found in the syllabus")
    semester: Optional[str] = Field(description="The semester or year if mentioned")
    modules: List[Module] = Field(description="List of all modules in the syllabus")