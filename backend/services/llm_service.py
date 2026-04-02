import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from schemas.syllabus import SyllabusResponse
from schemas.quiz import PrerequisiteResponse

# ==========================================
# 1. Extraction Pipeline (Raw PDF -> JSON)
# ==========================================

def get_syllabus_chain():
    """Initializes the Gemini model and returns the processing chain."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is missing.")

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview", 
        temperature=0, 
        api_key=api_key
    )

    structured_llm = llm.with_structured_output(SyllabusResponse)

    syllabus_prompt = PromptTemplate(
        template="""
        You are an expert curriculum analyzer.
        Extract the structured syllabus from the following raw text.
        
        INSTRUCTIONS:
        1. Ignore vertical watermarks (e.g., "D R A F T", "C O P Y") or scattered letters.
        2. Identify the Subject Name and Semester.
        3. Extract every Module with its Number, Title, and Detailed Topics.
        
        RAW TEXT:
        {text}
        """,
        input_variables=["text"],
    )

    return syllabus_prompt | structured_llm

async def generate_syllabus_json(clean_text: str):
    """Passes the cleaned text to Gemini and returns the structured Pydantic object."""
    chain = get_syllabus_chain()
    response = await chain.ainvoke({"text": clean_text})
    return response

# ==========================================
# 2. Inference Pipeline (Verified JSON -> Prerequisites)
# ==========================================

def _format_syllabus_to_md(syllabus: SyllabusResponse) -> str:
    """Dynamically converts the verified Pydantic object into token-efficient Markdown."""
    md_output = f"# Subject: {syllabus.subject_name}\n"
    md_output += f"**Semester:** {syllabus.semester}\n\n"
    
    for mod in syllabus.modules:
        md_output += f"## Module {mod.module_number}: {mod.module_title}\n"
        
        # Handle topics whether they are a list or a single text block
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
    
    # Bump temperature slightly for inference instead of strict extraction
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview", 
        temperature=0.2, 
        api_key=api_key
    )

    structured_llm = llm.with_structured_output(PrerequisiteResponse)

    prereq_prompt = PromptTemplate(
        template="""
        You are an expert academic curriculum architect.
        I will provide you with a structured syllabus for a university course.
        
        Your task is to reverse-engineer the dependencies. Identify the core foundational concepts 
        from PREVIOUS semesters that a student MUST already understand to succeed in this course.
        
        CRITICAL RULES:
        1. DO NOT list topics that are actually being taught in the provided syllabus.
        2. Focus on underlying mathematics, foundational programming, or core theories.
        3. Keep the topics broad enough to be testable via multiple-choice questions.
        
        TARGET SYLLABUS DATA (Markdown):
        {syllabus_json}
        """,
        input_variables=["syllabus_json"],
    )

    return prereq_prompt | structured_llm

async def generate_prerequisites(parsed_syllabus: SyllabusResponse) -> PrerequisiteResponse:
    """Passes the verified syllabus as efficient Markdown to deduce required prior knowledge."""
    chain = get_prerequisite_chain()
    
    # Flatten the verified SSOT data to save tokens
    efficient_md = _format_syllabus_to_md(parsed_syllabus)
    
    # Execute the inference chain
    response = await chain.ainvoke({"syllabus_json": efficient_md})
    return response