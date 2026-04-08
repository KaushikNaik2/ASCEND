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

    return UserStatusResponse(has_profile=has_profile, has_roadmap=has_roadmap)


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
