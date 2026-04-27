# backend/api/routers/user.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.database_service import DatabaseManager

router = APIRouter(prefix="/users", tags=["Users"])

db = DatabaseManager()


# ─── Request / Response Models ────────────────────────────────────────────────

class ProfileCreateRequest(BaseModel):
    user_id: str
    full_name: str
    university: str


class UserStatusResponse(BaseModel):
    has_profile: bool
    has_roadmap: bool
    has_baseline: bool


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/{user_id}/status", response_model=UserStatusResponse)
def get_user_status(user_id: str):
    """
    Check if a user has a profile and an active roadmap.
    Used by the frontend to decide routing after login.
    """
    # Check user_profiles table
    has_profile = False
    try:
        profile_resp = db.client.table("user_profiles") \
            .select("user_id") \
            .eq("user_id", user_id) \
            .execute()
        has_profile = len(profile_resp.data) > 0
    except Exception:
        has_profile = False

    # Check user_study_plans table for an active roadmap
    has_roadmap = False
    try:
        plans_resp = db.client.table("user_study_plans") \
            .select("id") \
            .eq("user_id", user_id) \
            .execute()
        has_roadmap = len(plans_resp.data) > 0
    except Exception:
        has_roadmap = False

    # Check user_baselines table for completed initial assessment
    has_baseline = False
    try:
        has_baseline = db.has_baseline(user_id)
    except Exception:
        has_baseline = False

    return UserStatusResponse(has_profile=has_profile, has_roadmap=has_roadmap, has_baseline=has_baseline)


@router.post("/profile")
def create_or_update_profile(payload: ProfileCreateRequest):
    """
    Upsert a user profile. Sets is_onboarded = true.
    """
    try:
        db.client.table("user_profiles").upsert({
            "user_id": payload.user_id,
            "full_name": payload.full_name,
            "university": payload.university,
            "is_onboarded": True,
        }).execute()

        return {"status": "success", "message": "Profile saved."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")


@router.get("/{user_id}/profile")
def get_profile(user_id: str):
    """
    Fetch the full user profile including computed stats (XP, mastered topics, streaks).
    Falls back to computing stats from existing data even if user_profiles row is missing.
    """
    profile = db.get_user_profile(user_id)
    if profile:
        return {"status": "success", "data": profile}
    
    # Fallback: compute stats from available data even without a user_profiles row
    try:
        from datetime import datetime, timedelta
        
        vec_resp = db.client.table("user_topic_vectors").select("is_mastered, last_updated").eq("user_id", user_id).execute()
        vectors = vec_resp.data or []
        topics_mastered = sum(1 for v in vectors if v.get("is_mastered"))
        topics_attempted = len(vectors)
        xp = (topics_attempted * 20) + (topics_mastered * 50)
        
        # Compute streak from real dates
        streak_days = db._calculate_streak(vectors)
        
        # Compute activity heatmap (last 105 days)
        activity_counts = {}
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
        
        plans_resp = db.client.table("user_study_plans").select("id, created_at").eq("user_id", user_id).order("created_at").execute()
        active_roadmaps = len(plans_resp.data) if plans_resp.data else 0
        joined_date = plans_resp.data[0]["created_at"] if plans_resp.data else None
        
        return {
            "status": "success",
            "data": {
                "full_name": None,  # Frontend will fallback to email
                "university": "ASCEND Explorer",
                "joined_date": joined_date,
                "xp": xp,
                "streak_days": streak_days,
                "topics_mastered": topics_mastered,
                "study_hours": int(topics_attempted * 0.5),
                "active_roadmaps": active_roadmaps,
                "activity_dates": activity_counts,
            }
        }
    except Exception:
        return {
            "status": "success",
            "data": {
                "full_name": None,
                "university": "ASCEND Explorer",
                "joined_date": None,
                "xp": 0,
                "streak_days": 0,
                "topics_mastered": 0,
                "study_hours": 0,
                "active_roadmaps": 0,
            }
        }


class TopicProgressRequest(BaseModel):
    topic_title: str
    status: str


@router.get("/{user_id}/roadmaps")
def get_user_roadmaps(user_id: str):
    """
    Fetch all active study plans for a given user.
    """
    try:
        roadmaps = db.get_user_roadmaps(user_id)
        return {"status": "success", "data": roadmaps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/roadmaps/{plan_id}/progress")
def update_topic_progress(user_id: str, plan_id: str, payload: TopicProgressRequest):
    """
    Update the user's progress status for a specific topic (pending, ongoing, skipped, done).
    """
    try:
        new_state = db.update_topic_status(user_id, plan_id, payload.topic_title, payload.status)
        return {"status": "success", "progress_state": new_state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard")
def get_leaderboard(limit: int = 20):
    """
    Fetch ranked leaderboard of users by XP.
    """
    entries = db.get_leaderboard(limit=limit)
    return {"status": "success", "data": entries}


@router.get("/{user_id}/vectors")
def get_user_vectors(user_id: str):
    """
    Fetch all proficiency vectors for a user.
    Used by Knowledge Graph to show real mastery instead of manual progress_state.
    """
    try:
        resp = db.client.table("user_topic_vectors") \
            .select("topic_name, proficiency_score, is_mastered") \
            .eq("user_id", user_id) \
            .execute()
        
        # Build a lookup dict: topic_name → {score, mastered}
        vectors = {}
        for v in (resp.data or []):
            vectors[v["topic_name"]] = {
                "proficiency_score": v.get("proficiency_score", 0),
                "is_mastered": v.get("is_mastered", False),
            }
        
        return {"status": "success", "data": vectors}
    except Exception as e:
        return {"status": "error", "data": {}, "message": str(e)}
