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
            
            response = self.client.table("golden_syllabuses").insert(payload).execute()
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
        
            return response.data[0] if response.data else {"proficiency_score": 0.1, "is_mastered": False}
        except Exception as e:
            print(f"❌ Proficiency Fetch Error: {e}")
            print(f"❌ Proficiency Fetch Error: {e}")
            return {"proficiency_score": 0.1, "is_mastered": False}

    def get_user_profile(self, user_id: str) -> dict | None:
        """
        Aggregates real user statistics for the Dashboard and Profile UI.
        """
        try:
            # 1. Fetch basic profile data
            prof_resp = self.client.table("user_profiles").select("*").eq("user_id", user_id).execute()
            if not prof_resp.data:
                return None
            profile = prof_resp.data[0]

            # 2. Fetch topic vectors to calculate XP and Mastery
            vec_resp = self.client.table("user_topic_vectors").select("is_mastered").eq("user_id", user_id).execute()
            vectors = vec_resp.data or []
            
            topics_attempted = len(vectors)
            topics_mastered = sum(1 for v in vectors if v.get("is_mastered"))
            
            # XP Logic: 20 per attempt, +50 bonus for hitting mastery
            xp = (topics_attempted * 20) + (topics_mastered * 50)
            
            # Study Hours (approximate: 30 mins per topic attempted)
            study_hours = int(topics_attempted * 0.5)

            # 3. Fetch active roadmaps
            plans_resp = self.client.table("user_study_plans").select("id").eq("user_id", user_id).execute()
            active_roadmaps = len(plans_resp.data) if plans_resp.data else 0

            return {
                "full_name": profile.get("full_name", "Student"),
                "university": profile.get("university", "Unknown University"),
                "joined_date": profile.get("created_at", "Just now"),
                "xp": xp,
                "streak_days": 1, # Future: Calculate from distinct last_updated dates
                "topics_mastered": topics_mastered,
                "study_hours": study_hours,
                "active_roadmaps": active_roadmaps
            }
        except Exception as e:
            print(f"❌ Get Profile Stats Error: {e}")
            return None

    def get_plan_details(self, plan_id: str) -> dict | None:
        try:
            response = self.client.table("user_study_plans").select("golden_syllabus_id").eq("id", plan_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"❌ Plan Fetch Error: {e}")
            return None

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
            return self.client.table("user_topic_vectors").upsert(
                payload, 
                on_conflict="user_id,topic_name"
            ).execute()
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

    # --- ROADMAP & PROGRESS OPERATIONS ---

    def get_user_roadmaps(self, user_id: str):
        try:
            response = self.client.table("user_study_plans") \
                .select("id, golden_syllabus_id, customized_syllabus, progress_state, created_at") \
                .eq("user_id", user_id) \
                .order("created_at", desc=True) \
                .execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Fetch Roadmaps Error: {e}")
            return []

    def update_topic_status(self, user_id: str, plan_id: str, topic_title: str, status: str):
        try:
            # 1. Fetch current progress_state
            resp = self.client.table("user_study_plans") \
                .select("progress_state") \
                .eq("id", plan_id) \
                .eq("user_id", user_id) \
                .execute()
            
            if not resp.data:
                raise Exception("Study plan not found or unauthorized")
                
            current_state = resp.data[0].get("progress_state") or {}
            
            # 2. Update status
            current_state[topic_title] = status
            
            # 3. Save back
            update_resp = self.client.table("user_study_plans") \
                .update({"progress_state": current_state}) \
                .eq("id", plan_id) \
                .execute()
                
            return current_state
        except Exception as e:
            print(f"❌ Update Topic Status Error: {e}")
            raise e

db = DatabaseManager()