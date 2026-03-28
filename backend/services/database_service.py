import os
from supabase import create_client, Client

class DatabaseManager:
    """
    Singleton class to manage the Supabase PostgreSQL connection.
    Ensures only one network connection is opened per FastAPI worker.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            
            if not url or not key:
                raise ValueError("🚨 SUPABASE_URL or SUPABASE_KEY missing from .env")
                
            cls._instance.client: Client = create_client(url, key)
            print("🔌 Supabase Singleton Connection Initialized.")
            
        return cls._instance

    # ---------------------------------------------------------
    # Phase 2: SSOT Operations
    # ---------------------------------------------------------

    def get_golden_record(self, university: str, department_code: str, semester: str) -> dict | None:
        """Searches the Vault for an existing parsed syllabus."""
        try:
            response = self.client.table("golden_syllabuses").select("*").eq(
                "university", university
            ).eq(
                "department_code", department_code
            ).eq(
                "semester", semester
            ).execute()
            
            # If the data array has items, return the first match
            if response.data and len(response.data) > 0:
                return response.data
            return None
            
        except Exception as e:
            print(f"❌ Database Read Error: {e}")
            return None

    def insert_golden_record(self, university: str, department_code: str, semester: str, syllabus_data: list) -> dict | None:
        """Promotes a verified JSON array to the Single Source of Truth."""
        try:
            payload = {
                "university": university,
                "department_code": department_code,
                "semester": semester,
                "syllabus_data": syllabus_data
            }
            
            response = self.client.table("golden_syllabuses").insert(payload).execute()
            return response.data if response.data else None
            
        except Exception as e:
            print(f"❌ Database Write Error: {e}")
            return None

# Export the singleton instance to be imported by main.py
db = DatabaseManager()