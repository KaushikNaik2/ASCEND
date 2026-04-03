# backend/services/database_service.py

import os
from supabase import create_client, Client

class DatabaseManager:
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

    # --- VAULT OPERATIONS ---

    def get_syllabus_by_hash(self, file_hash: str) -> dict | None:
        try:
            response = self.client.table("golden_syllabuses").select("*").eq("file_hash", file_hash).execute()
            # Supabase returns a list. We only need the first match.
            return response.data if response.data else None
        except Exception as e:
            print(f"❌ Hash Lookup Error: {e}")
            return None

    def create_draft_syllabus(self, file_hash: str, syllabus_json: list, user_id: str = None):
        try:
            # syllabus_json is a list of subjects. Pull metadata from the first one.
            primary_subject = syllabus_json if syllabus_json else {}
            
            payload = {
                "file_hash": file_hash,
                "subject_name": primary_subject.get("subject_name", "Unknown Subject"),
                "university": "Mumbai University",
                "semester": str(primary_subject.get("semester", "Unknown")),
                "syllabus_data": syllabus_json,
                "is_verified": False,
                "verified_by": user_id
            }
            return self.client.table("golden_syllabuses").insert(payload).execute()
        except Exception as e:
            print(f"❌ Draft Save Error: {e}")
            raise e

    # --- PROFICIENCY OPERATIONS ---

    def get_user_topic_score(self, user_id: str, topic_name: str) -> dict:
        """Retrieves proficiency. Defaults to 0.1 (Beginner) if not found."""
        try:
            # Fixed whitespace in table name below
            response = self.client.table("user_topic_vectors") \
                .select("proficiency_score, is_mastered") \
                .eq("user_id", user_id) \
                .eq("topic_name", topic_name) \
                .execute()
        
            return response.data if response.data else {"proficiency_score": 0.1, "is_mastered": False}
        except Exception as e:
            print(f"❌ Proficiency Fetch Error: {e}")
            return {"proficiency_score": 0.1, "is_mastered": False}

    def update_user_proficiency(self, user_id: str, subject_id: str, topic_name: str, new_score: float, is_mastered: bool):
        try:
            payload = {
                "user_id": user_id,
                "subject_id": subject_id,
                "topic_name": topic_name,
                "proficiency_score": new_score,
                "is_mastered": is_mastered,
                "last_updated": "now()"
            }
            return self.client.table("user_topic_vectors").upsert(payload).execute()
        except Exception as e:
            print(f"❌ Proficiency Update Error: {e}")
            raise e

    def save_quiz_question_vector(self, syllabus_id: str, question_data: dict, embedding: list):
        try:
            payload = {
                "golden_syllabus_id": syllabus_id,
                "question_text": question_data["question_text"],
                "options": question_data["options"],
                "correct_option": question_data["correct_option"],
                "explanation": question_data["explanation"],
                "metadata": {
                    "difficulty": question_data["difficulty_level"],
                    "format": question_data["question_format"],
                    "bloom": question_data["blooms_taxonomy_level"]
                },
                "primary_concept": question_data["primary_concept"],
                "embedding": embedding 
            }
            return self.client.table("quiz_questions").insert(payload).execute()
        except Exception as e:
            print(f"❌ Question Vector Save Error: {e}")

db = DatabaseManager()