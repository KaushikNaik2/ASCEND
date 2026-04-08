# backend/services/llm_service.py

import os,json
from langchain_google_genai import ChatGoogleGenerativeAI
from schemas.syllabus import SyllabusResponse
from schemas.quiz import PrerequisiteResponse, AdaptiveQuizResponse
from core.templates import get_syllabus_extraction_prompt, get_prerequisite_inference_prompt,  get_adaptive_quiz_prompt

# ==========================================
# 1. Extraction Pipeline (Raw PDF -> JSON)
# ==========================================

def get_syllabus_chain():
    """Initializes the Gemini extraction chain."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is missing.")

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview", 
        temperature=0, 
        api_key=api_key
    )

    from schemas.syllabus import SyllabusCollection
    structured_llm = llm.with_structured_output(SyllabusCollection)
    syllabus_prompt = get_syllabus_extraction_prompt()

    return syllabus_prompt | structured_llm

async def generate_syllabus_json(clean_text: str):
    chain = get_syllabus_chain()
    return await chain.ainvoke({"text": clean_text})

# Add this inside backend/services/llm_service.py, right after generate_syllabus_json

def merge_syllabus_chunks(chunk_responses: list[dict]) -> list[dict]:
    """
    Merges duplicate dictionary SyllabusResponse objects into a unified list.
    Safeguards against overlapping chunks common in university syllabus PDFs.
    """
    merged_subjects = {}

    for syllabus_dict in chunk_responses:
        # Failsafe if Gemini hallucinated an empty response
        if not syllabus_dict or not syllabus_dict.get('subject_name'):
            continue
            
        subject_name = syllabus_dict.get('subject_name').strip()
        
        if subject_name not in merged_subjects:
            # First time seeing this subject -> Initialize
            merged_subjects[subject_name] = {
                "id": subject_name.lower().replace(" ", "-"), 
                "subject_name": subject_name,
                "semester": syllabus_dict.get('semester'),
                "modules": list(syllabus_dict.get('modules', []))
            }
        else:
            # Duplicate chunk -> Merge modules, avoiding exact duplicates
            existing_module_titles = {
                m.get("title", "").lower().strip() 
                for m in merged_subjects[subject_name]["modules"]
            }
            
            for mod in syllabus_dict.get('modules', []):
                mod_title = mod.get("title", "").lower().strip()
                if mod_title and mod_title not in existing_module_titles:
                    merged_subjects[subject_name]["modules"].append(mod)

    return list(merged_subjects.values())
# ==========================================
# 2. Inference Pipeline (Verified JSON -> Prerequisites)
# ==========================================

def _format_syllabus_to_md(syllabus: SyllabusResponse) -> str:
    """Dynamically converts the verified Pydantic object into token-efficient Markdown."""
    md_output = f"# Subject: {syllabus.subject_name}\n"
    md_output += f"**Semester:** {syllabus.semester}\n\n"
    for mod in syllabus.modules:
        md_output += f"## Module {mod.module_number}: {mod.module_title}\n"
        if isinstance(mod.detailed_topics, list):
            for topic in mod.detailed_topics:
                md_output += f"- {topic}\n"
        else:
            md_output += f"{mod.detailed_topics}\n"
        md_output += "\n"
    return md_output

def get_prerequisite_chain():
    """Initializes the LLM chain to infer foundational knowledge."""
    api_key = os.getenv("GOOGLE_API_KEY")
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview", 
        temperature=0.2, 
        api_key=api_key
    )

    structured_llm = llm.with_structured_output(PrerequisiteResponse)
    prereq_prompt = get_prerequisite_inference_prompt()

    return prereq_prompt | structured_llm

async def generate_prerequisites(parsed_syllabus: SyllabusResponse) -> PrerequisiteResponse:
    chain = get_prerequisite_chain()
    efficient_md = _format_syllabus_to_md(parsed_syllabus)
    return await chain.ainvoke({"syllabus_json": efficient_md})

# ==========================================
# 3. Assessment Pipeline (Topics + Vector -> Quiz)
# ==========================================

def get_adaptive_quiz_chain():
    """Initializes the LLM chain to generate vector-ready quiz questions."""
    api_key = os.getenv("GOOGLE_API_KEY")
    
    # Temperature 0.4 allows for creative distractors and question variety 
    # without breaking the strict Pydantic JSON structure.
    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview", 
        temperature=0.2, 
        api_key=api_key
    )

    structured_llm = llm.with_structured_output(AdaptiveQuizResponse)
    quiz_prompt = get_adaptive_quiz_prompt()

    return quiz_prompt | structured_llm

async def generate_adaptive_quiz(
    user_proficiency_map: dict, 
    target_topics_md: str, 
    num_questions: int = 10
) -> AdaptiveQuizResponse:
    """
    Passes the student's topic-level proficiency and the target syllabus to Gemini.
    """
    chain = get_adaptive_quiz_chain()
    
    # 1. The Mastery Filter: Pre-process the vector to isolate completed topics
    MASTERY_THRESHOLD = 0.90
    
    mastered_topics = {
        topic: score for topic, score in user_proficiency_map.items() 
        if score >= MASTERY_THRESHOLD
    }
    active_learning_topics = {
        topic: score for topic, score in user_proficiency_map.items() 
        if score < MASTERY_THRESHOLD
    }
    
    # 2. Build the context string to force Gemini to respect the mastery threshold
    proficiency_context = (
        f"ACTIVE LEARNING TOPICS (Focus 80% of questions here):\n"
        f"{json.dumps(active_learning_topics, indent=2)}\n\n"
        f"MASTERED / COMPLETED TOPICS (Focus 20% of questions here for retention ONLY):\n"
        f"{json.dumps(mastered_topics, indent=2)}"
    )
    
    # 3. Execute the inference chain
    response = await chain.ainvoke({
        "user_proficiency": proficiency_context,
        "target_topics_md": target_topics_md,
        "num_questions": num_questions
    })
    
    return response