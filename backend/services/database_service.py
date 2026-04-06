# backend/services/database_service.py

import os
import dotenv
dotenv.load_dotenv()
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
        """
        The primary 'Vault' check. If the hash exists, we skip Gemini.
        Returns the dictionary record if found, otherwise None.
        """
        try:
            response = self.client.table("golden_syllabuses").select("*").eq("file_hash", file_hash).execute()
            # Safely grab the first item in the list if it exists
            if hasattr(response, 'data') and isinstance(response.data, list) and len(response.data) > 0:
                return response.data # <-- Added
            return None
        except Exception as e:
            print(f"❌ Hash Lookup Error: {e}")
            return None

    def create_draft_syllabus(self, file_hash: str, syllabus_json: list, department_code: str, user_id: str = None):
        try:
            # 1. Safely extract the first subject (ensure it's actually a list with items)
            first_subject = syllabus_json if (isinstance(syllabus_json, list) and len(syllabus_json) > 0) else {} # <-- Added
            
            # 2. Safely grab the semester (ensure first_subject is a dictionary before calling .get)
            semester_val = str(first_subject.get("semester", "Unknown")) if isinstance(first_subject, dict) else "Unknown"
            
            payload = {
                "file_hash": file_hash,
                "university": "Mumbai University",
                "department_code": department_code, 
                "semester": semester_val,
                "syllabus_data": syllabus_json,
                "is_verified": False,
                "verified_by": user_id
            }
            
            response = self.client.table("golden_syllabuses").insert(payload).select().execute()
            return response
        except Exception as e:
            print(f"❌ Draft Save Error: {e}")
            raise e

    # --- PROFICIENCY OPERATIONS ---

    def get_user_topic_score(self, user_id: str, topic_name: str) -> dict:
        try:
            response = self.client.table("user_topic_vectors") \
                .select("proficiency_score, is_mastered") \
                .eq("user_id", user_id) \
                .eq("topic_name", topic_name) \
                .execute()
        
            return response.data if response.data else {"proficiency_score": 0.1, "is_mastered": False} # <-- Added
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

    # --- Saving Customized Syllabus ---

    def save_user_customized_syllabus(self, user_id: str, golden_syllabus_id: str, customized_data: list):
        try:
            payload = {
                "user_id": user_id,
                "golden_syllabus_id": golden_syllabus_id,
                "customized_syllabus": customized_data
            }
            return self.client.table("user_study_plans").upsert(payload).execute()
        except Exception as e:
            print(f"❌ Sandbox Save Error: {e}")
            raise e

    def increment_edit_consensus(self, golden_syllabus_id: str):
        try:
            current = self.client.table("golden_syllabuses") \
                .select("edit_consensus_count") \
                .eq("id", golden_syllabus_id) \
                .execute()
            
            # THE FIX: Add to grab the dictionary, and handle potential nulls
            count = (current.data[0].get("edit_consensus_count") or 0) + 1 if (hasattr(current, 'data') and isinstance(current.data, list) and len(current.data) > 0) else 1

            update_data = {"edit_consensus_count": count}
            if count >= 3:
                update_data["is_verified"] = True
                print(f"🏆 Consensus Reached! Syllabus {golden_syllabus_id} promoted to Golden.")

            return self.client.table("golden_syllabuses") \
                .update(update_data) \
                .eq("id", golden_syllabus_id) \
                .execute()
        except Exception as e:
            print(f"❌ Consensus Tracking Error: {e}")

db = DatabaseManager()