import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Initializes and returns the Supabase client using environment variables."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("Supabase credentials are missing from the .env file.")
        
    return create_client(url, key)

# Create a singleton instance to be used across your app
db: Client = get_supabase_client()

# ==========================================
# Phase 2: Syllabus CRUD Operations
# ==========================================

def get_cached_syllabus(department_code: str, semester: str):
    """
    Queries Supabase to see if this specific syllabus has already been parsed.
    Example: department_code="MU_IT", semester="SEM5"
    """
    try:
        # We will write the Supabase query here next
        pass
    except Exception as e:
        print(f"Database Read Error: {e}")
        return None

def save_parsed_syllabus(department_code: str, semester: str, syllabus_json: list):
    """
    Saves the expensive Gemini output to Supabase so we never have to parse it again.
    """
    try:
        # We will write the Supabase insert here next
        pass
    except Exception as e:
        print(f"Database Write Error: {e}")
        return False