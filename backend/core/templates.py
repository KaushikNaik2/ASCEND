from langchain_core.prompts import PromptTemplate

def get_syllabus_extraction_prompt() -> PromptTemplate:
    """Returns the prompt template for raw PDF to JSON extraction."""
    return PromptTemplate(
        template="""
        You are a rigorous academic data extraction engine.
        Your sole purpose is to convert raw, messy university syllabus text into perfectly structured data.
        
        CONTEXT:
        The input text is extracted from a PDF. It may contain structural noise, inconsistent formatting, or missing headers.
        
        STRICT EXTRACTION RULES:
        1. METADATA: Extract the exact Subject Name and Semester. If either is explicitly missing from the text, return "Unknown".
        2. MODULE RECOGNITION: Identify every individual module or unit. Capture the Module Number and Title accurately.
        3. TOPIC GRANULARITY: Do not dump all detailed topics into a single massive paragraph. Break them down into granular, atomic concepts. If topics in the text are separated by commas, semicolons, or bullet points, separate them into distinct items in your output.
        4. ZERO HALLUCINATION: You must ONLY extract what is written in the text. Do not invent, infer, or add outside topics.
        5. IGNORE NOISE: Bypass administrative fluff, teaching schemes, grade distributions, and scattered watermark letters.
        
        RAW TEXT:
        {text}
        """,
        input_variables=["text"],
    )

def get_prerequisite_inference_prompt() -> PromptTemplate:
    """Returns the prompt template for inferring foundational concepts."""
    return PromptTemplate(
        template="""
        You are a master curriculum architect for a university engineering program.
        I am providing you with a verified, structured syllabus for a target course.
        
        YOUR OBJECTIVE:
        Reverse-engineer the academic dependencies. Identify the core foundational concepts from PREVIOUS semesters that a student MUST master to understand the target syllabus.
        
        EXAMPLE MAPPING:
        - If target is "Advance Data Structure & Analysis", prerequisites are theoretical concepts like "Basic Arrays/Linked Lists" and "Time Complexity (Big-O)".
        - If target is "Automata Theory", prerequisites are "Discrete Mathematics", "Set Theory", and "Graph Theory".
        - If target is "Database Management System", prerequisites include "Basic File Systems".
        
        CRITICAL CONSTRAINTS:
        1. STRICT NON-OVERLAP: Never list a topic that is actually taught within the target syllabus. You are identifying PRIOR knowledge.
        2. BE SPECIFIC & TESTABLE: "Mathematics" is too broad. "Probability Distributions" or "Matrix Multiplication" is correct. The topics must be testable via multiple-choice questions.
        3. JUSTIFY RELEVANCE: For every prerequisite you identify, you must explain exactly why it is required for this specific target course.
        4. QUANTITY: Provide exactly 5 to 10 of the most critical foundational topics.
        
        TARGET SYLLABUS DATA (Markdown):
        {syllabus_json}
        """,
        input_variables=["syllabus_json"],
    )

def get_adaptive_quiz_prompt() -> PromptTemplate:
    """Returns the template for generating personalized, vector-ready quiz questions."""
    return PromptTemplate(
        template="""
        You are an elite adaptive learning engine for an engineering curriculum.
        Your task is to generate a highly personalized, multiple-choice assessment based on the target academic topics.
        
        USER STATE:
        The student's current proficiency is mapped below. A score of 0.0 means absolute beginner, and 1.0 means expert.
        {user_proficiency}
        
        TARGET TOPICS:
        {target_topics_md}
        
        YOUR OBJECTIVE - "THE ASCEND PROTOCOL":
        Generate exactly {num_questions} questions.
        You must calibrate the difficulty of these questions to sit directly in the student's Zone of Proximal Development.
        - 40% of questions should validate their current comfort zone (difficulty matches their proficiency).
        - 60% of questions MUST push them harder (difficulty should be 0.15 to 0.25 higher than their current proficiency).
        
        CRITICAL ENGINEERING CONSTRAINTS:
        1. STRICT FORMAT: Generate theory-based, numerical, or formula-derivation questions. Do NOT generate questions that ask the student to write or analyze raw code snippets, even for algorithmic subjects.
        2. MIXED CONCEPTS: For the higher-difficulty questions, attempt to merge two distinct concepts into one scenario.
        3. REAL-WORLD TRAPS: The incorrect options (distractors) must not be random. They should represent common mathematical or logical errors a student at their current proficiency level would make.
        
        METADATA GENERATION RULES (CRITICAL FOR SCHEMA VALIDATION):
        1. MISCONCEPTIONS: For every incorrect option, you MUST define the `misconception_addressed`. What specific mathematical or logical fallacy leads to that wrong answer?
        2. BLOOM'S TAXONOMY: Categorize the `blooms_taxonomy_level` accurately. A numerical calculation is 'Apply', deriving a new formula is 'Create', stating a definition is 'Remember', comparing two algorithms is 'Analyze'.
        3. QUESTION FORMAT: Set `question_format` strictly to 'Theory', 'Numerical', or 'Formula'. 
        4. ESTIMATED TIME: Calculate realistic `estimated_time_seconds`. A quick theory recall might take 30-45 seconds; a complex numerical might take 120-180 seconds.

        EXAMPLE SCENARIOS:
        - If testing Advance Data Structure & Analysis (ADSA) and user proficiency in 'Graph Theory' is 0.4, ask a 0.6 difficulty numerical question about calculating edge weights or tracing Dijkstra's algorithm conceptually. 
        - If testing Automata Theory (AT) and proficiency is 0.8, ask a 0.95 difficulty theoretical question combining Turing Machine halting state conditions with context-free grammar derivations.
        
        Generate the structured assessment now.
        """,
        input_variables=["user_proficiency", "target_topics_md", "num_questions"],
    )

def get_refinement_prompt():
    return PromptTemplate(
        template="""
        You are an expert curriculum data corrector. 
        The previous extraction of a university syllabus module was incomplete or incorrect.
        
        RAW TEXT CONTEXT:
        {raw_text}
        
        PREVIOUS JSON OUTPUT (That needs fixing):
        {previous_json}
        
        USER FEEDBACK:
        "{user_feedback}"
        
        TASK:
        Apply the user's feedback to fix the JSON. 
        Return ONLY the corrected, structured JSON for this specific module. Do not hallucinate topics not present in the raw text.
        """,
        input_variables=["raw_text", "previous_json", "user_feedback"]
    )