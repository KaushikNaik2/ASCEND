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
            vec_resp = self.client.table("user_topic_vectors").select("is_mastered, last_updated").eq("user_id", user_id).execute()
            vectors = vec_resp.data or []
            
            topics_attempted = len(vectors)
            topics_mastered = sum(1 for v in vectors if v.get("is_mastered"))
            
            # XP Logic: 20 per attempt, +50 bonus for hitting mastery
            xp = (topics_attempted * 20) + (topics_mastered * 50)
            
            # Study Hours (approximate: 30 mins per topic attempted)
            study_hours = int(topics_attempted * 0.5)

            # 3. Streak Calculation — count consecutive days with activity
            streak_days = self._calculate_streak(vectors)

            # 3.5 Activity heatmap — count activity per day (last 105 days = 15 weeks)
            from datetime import datetime, timedelta
            activity_counts: dict[str, int] = {}
            cutoff = (datetime.now() - timedelta(days=105)).date()
            for v in vectors:
                ts = v.get("last_updated")
                if ts:
                    try:
                        dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).date()
                        if dt >= cutoff:
                            key = dt.isoformat()
                            activity_counts[key] = activity_counts.get(key, 0) + 1
                    except (ValueError, AttributeError):
                        pass

            # 4. Fetch active roadmaps
            plans_resp = self.client.table("user_study_plans").select("id").eq("user_id", user_id).execute()
            active_roadmaps = len(plans_resp.data) if plans_resp.data else 0

            return {
                "full_name": profile.get("full_name", "Student"),
                "university": profile.get("university", "Unknown University"),
                "joined_date": profile.get("created_at", "Just now"),
                "xp": xp,
                "streak_days": streak_days,
                "topics_mastered": topics_mastered,
                "study_hours": study_hours,
                "active_roadmaps": active_roadmaps,
                "activity_dates": activity_counts,
            }
        except Exception as e:
            print(f"❌ Get Profile Stats Error: {e}")
            return None

    def _calculate_streak(self, vectors: list[dict]) -> int:
        """Count consecutive days of activity ending today (or yesterday)."""
        from datetime import datetime, timedelta
        
        if not vectors:
            return 0
        
        # Extract unique activity dates
        activity_dates = set()
        for v in vectors:
            ts = v.get("last_updated")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    activity_dates.add(dt.date())
                except (ValueError, AttributeError):
                    pass
        
        if not activity_dates:
            return 0
        
        today = datetime.now().date()
        
        # Start counting from today or yesterday
        if today in activity_dates:
            current = today
        elif (today - timedelta(days=1)) in activity_dates:
            current = today - timedelta(days=1)
        else:
            return 0
        
        streak = 0
        while current in activity_dates:
            streak += 1
            current -= timedelta(days=1)
        
        return streak

    def get_leaderboard(self, limit: int = 20) -> list[dict]:
        """
        Compute leaderboard by aggregating XP across all users.
        Returns ranked list of users with their stats.
        """
        try:
            # Fetch all user_topic_vectors
            vec_resp = self.client.table("user_topic_vectors") \
                .select("user_id, is_mastered, last_updated") \
                .execute()
            vectors = vec_resp.data or []
            
            # Group by user_id
            user_stats: dict[str, dict] = {}
            for v in vectors:
                uid = v["user_id"]
                if uid not in user_stats:
                    user_stats[uid] = {"attempted": 0, "mastered": 0, "vectors": []}
                user_stats[uid]["attempted"] += 1
                if v.get("is_mastered"):
                    user_stats[uid]["mastered"] += 1
                user_stats[uid]["vectors"].append(v)
            
            # Fetch all profiles for names
            prof_resp = self.client.table("user_profiles").select("user_id, full_name, university").execute()
            profiles = {p["user_id"]: p for p in (prof_resp.data or [])}
            
            # Build leaderboard entries
            entries = []
            for uid, stats in user_stats.items():
                xp = (stats["attempted"] * 20) + (stats["mastered"] * 50)
                streak = self._calculate_streak(stats["vectors"])
                profile = profiles.get(uid, {})
                
                entries.append({
                    "user_id": uid,
                    "name": profile.get("full_name", f"User-{uid[:6]}"),
                    "institution": profile.get("university", "Mumbai University"),
                    "xp": xp,
                    "streak_days": streak,
                    "topics_mastered": stats["mastered"],
                })
            
            # Sort by XP descending
            entries.sort(key=lambda e: e["xp"], reverse=True)
            
            # Assign ranks
            for i, entry in enumerate(entries[:limit]):
                entry["rank"] = i + 1
            
            return entries[:limit]
        except Exception as e:
            print(f"❌ Leaderboard Error: {e}")
            return []

    def get_plan_details(self, plan_id: str) -> dict | None:
        try:
            response = self.client.table("user_study_plans").select("golden_syllabus_id").eq("id", plan_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"❌ Plan Fetch Error: {e}")
            return None

    def get_plan_mapped_concepts(self, plan_id: str) -> list[str]:
        """Extracts matched_concept names from a user's confirmed study plan.
        Returns only non-UNMAPPED concepts the student actually has to study."""
        try:
            response = self.client.table("user_study_plans") \
                .select("customized_syllabus") \
                .eq("id", plan_id) \
                .execute()
            if not response.data or len(response.data) == 0:
                return []
            
            syllabus = response.data[0].get("customized_syllabus")
            if not syllabus:
                return []
            
            # Handle both list-of-mappings and dict-with-mappings formats
            mappings = syllabus if isinstance(syllabus, list) else syllabus.get("mappings", [])
            
            return [
                m["matched_concept"] for m in mappings
                if isinstance(m, dict) 
                and m.get("matched_concept") 
                and m["matched_concept"] != "UNMAPPED"
            ]
        except Exception as e:
            print(f"❌ Plan Concepts Fetch Error: {e}")
            return []

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

    # --- ATOMIC SHIFT OPERATIONS ---

    def resolve_concept_ids(self, concept_names: list[str], subject: str) -> dict[str, str]:
        """Maps concept names to concept_clusters UUIDs from the Truth Layer."""
        try:
            response = self.client.table("concept_clusters") \
                .select("id, concept_name") \
                .eq("subject", subject) \
                .in_("concept_name", concept_names) \
                .execute()
            return {r["concept_name"]: r["id"] for r in (response.data or [])}
        except Exception as e:
            print(f"❌ Concept Resolution Error: {e}")
            return {}

    def save_atomic_roadmap(self, user_id: str, golden_syllabus_id: str,
                            mapped_concepts: list[dict]) -> dict:
        """Saves a roadmap built from atomic concept IDs with initial progress."""
        progress_state = {
            c["matched_concept"]: "pending"
            for c in mapped_concepts
            if c.get("matched_concept") and c["matched_concept"] != "UNMAPPED"
        }
        payload = {
            "user_id": user_id,
            "golden_syllabus_id": golden_syllabus_id,
            "customized_syllabus": mapped_concepts,
            "progress_state": progress_state,
        }
        try:
            return self.client.table("user_study_plans").upsert(payload).execute()
        except Exception as e:
            print(f"❌ Atomic Roadmap Save Error: {e}")
            raise e

    # --- BASELINE ASSESSMENT OPERATIONS ---

    def mark_baseline_complete(self, user_id: str, subject_id: str):
        """Records that a user has completed baseline assessment for a subject."""
        try:
            self.client.table("user_baselines").upsert({
                "user_id": user_id,
                "subject_id": subject_id,
                "completed_at": "now()",
            }).execute()
        except Exception as e:
            print(f"❌ Baseline Mark Error: {e}")

    def has_baseline(self, user_id: str) -> bool:
        """Check if user has completed any baseline assessment."""
        try:
            resp = self.client.table("user_baselines") \
                .select("id") \
                .eq("user_id", user_id) \
                .limit(1) \
                .execute()
            return len(resp.data) > 0 if resp.data else False
        except Exception:
            return False

db = DatabaseManager()