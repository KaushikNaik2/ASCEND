import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from schemas.syllabus import SyllabusResponse

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
    # Execute the chain asynchronously
    response = await chain.ainvoke({"text": clean_text})
    return response