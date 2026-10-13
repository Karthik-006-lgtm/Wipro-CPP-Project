import io
import os
import re
import uuid
from datetime import datetime, timezone, date
from typing import Optional, List
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserActivity
from app.schemas.auth import UserResponse
from app.schemas.profile import (
    ProfileUpdateRequest,
    ProfileDashboardResponse,
    ProfileSummaryStats,
    UserActivityResponse,
    UserActivityCreate,
)
from app.api.deps import get_current_user

router = APIRouter()

ALLOWED_IMAGE_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
FILENAME_SAFE_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+\.(jpg|jpeg|png|webp)$", re.IGNORECASE)


def _ensure_avatar_dir() -> str:
    avatar_dir = os.path.abspath(os.path.join(os.getcwd(), settings.AVATAR_UPLOAD_DIR))
    os.makedirs(avatar_dir, exist_ok=True)
    return avatar_dir


@router.get("/", response_model=UserResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the authenticated user's profile.
    """
    return UserResponse.model_validate(current_user)


@router.put("/", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated user's profile details.
    """
    if payload.full_name is not None:
        trimmed = payload.full_name.strip()
        if not trimmed:
            raise HTTPException(status_code=400, detail="Full name cannot be blank.")
        current_user.full_name = trimmed

    if payload.github_url is not None:
        current_user.github_url = payload.github_url.strip() or None

    if payload.linkedin_url is not None:
        current_user.linkedin_url = payload.linkedin_url.strip() or None

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/photo", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Uploads or replaces the user's avatar image.
    Validates file size (max 2MB), magic bytes and format (JPEG/PNG/WebP).
    """
    # 1. Content-type check
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image format. Allowed formats: JPEG, PNG, WebP.",
        )

    # 2. Size check
    contents = await file.read()
    if len(contents) > settings.MAX_AVATAR_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image file exceeds maximum allowed size of {settings.MAX_AVATAR_SIZE_BYTES // (1024*1024)}MB.",
        )

    # 3. Magic bytes / Pillow validation
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()  # Verifies file integrity and format
        if image.format not in ALLOWED_IMAGE_FORMATS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image encoding. Please upload a genuine JPEG, PNG, or WebP image.",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not process image. The file may be corrupt or not a valid image.",
        )

    # Re-open image since verify() mutates the stream
    image = Image.open(io.BytesIO(contents))

    avatar_dir = _ensure_avatar_dir()
    extension = ALLOWED_IMAGE_EXTENSIONS[content_type]
    unique_filename = f"{uuid.uuid4().hex}.{extension}"
    target_path = os.path.join(avatar_dir, unique_filename)

    # Delete old avatar file if locally stored
    if current_user.avatar_url and "/api/v1/profile/avatar/" in current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/api/v1/profile/avatar/")[-1]
        old_path = os.path.join(avatar_dir, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    # Save new image file
    with open(target_path, "wb") as f:
        f.write(contents)

    current_user.avatar_url = f"/api/v1/profile/avatar/{unique_filename}"
    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.delete("/photo", response_model=UserResponse)
def remove_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Removes the user's avatar image.
    """
    avatar_dir = _ensure_avatar_dir()
    if current_user.avatar_url and "/api/v1/profile/avatar/" in current_user.avatar_url:
        filename = current_user.avatar_url.split("/api/v1/profile/avatar/")[-1]
        file_path = os.path.join(avatar_dir, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

    current_user.avatar_url = None
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/avatar/{filename}")
def serve_avatar(filename: str):
    """
    Publicly serves an uploaded avatar image with path traversal protection.
    """
    if not FILENAME_SAFE_REGEX.match(filename):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    avatar_dir = _ensure_avatar_dir()
    file_path = os.path.join(avatar_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Avatar image not found.")

    return FileResponse(file_path)


@router.get("/activity", response_model=ProfileDashboardResponse)
def get_profile_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregates real user activity statistics across coding sandbox, interview drills,
    resume parsing/generation, and company matching.
    """
    activities: List[UserActivity] = (
        db.query(UserActivity)
        .filter(UserActivity.user_id == current_user.id)
        .order_by(UserActivity.created_at.desc())
        .all()
    )

    today = date.today()
    total_activities = len(activities)
    coding_runs_today = 0
    coding_accepted_today = 0
    difficulty_breakdown = {"Easy": 0, "Medium": 0, "Hard": 0}
    topics_set = set()
    interview_drills_count = 0
    resumes_parsed_count = 0
    resumes_generated_count = 0
    companies_matched_count = 0

    recent_submissions = []

    for act in activities:
        act_date = act.created_at.date() if act.created_at else None
        meta = act.metadata_json or {}

        # Coding activities
        if act.activity_type in ("coding_run", "coding_submit"):
            if act_date == today:
                coding_runs_today += 1
                if act.status.lower() in ("accepted", "passed"):
                    coding_accepted_today += 1

            if act.activity_type == "coding_submit":
                diff = meta.get("difficulty")
                if diff and diff.capitalize() in difficulty_breakdown:
                    difficulty_breakdown[diff.capitalize()] += 1

                topic = meta.get("topic") or meta.get("topic_name")
                if topic:
                    topics_set.add(topic)

                if len(recent_submissions) < 10:
                    recent_submissions.append(UserActivityResponse.model_validate(act))

        elif act.activity_type in ("video_practice", "company_drill"):
            interview_drills_count += 1

        elif act.activity_type == "resume_parse":
            resumes_parsed_count += 1

        elif act.activity_type == "resume_generate":
            resumes_generated_count += 1

        elif act.activity_type == "company_match":
            companies_matched_count += 1

    stats = ProfileSummaryStats(
        total_activities=total_activities,
        coding_runs_today=coding_runs_today,
        coding_accepted_today=coding_accepted_today,
        difficulty_breakdown=difficulty_breakdown,
        topics_explored=sorted(list(topics_set)),
        interview_drills_count=interview_drills_count,
        resumes_parsed_count=resumes_parsed_count,
        resumes_generated_count=resumes_generated_count,
        companies_matched_count=companies_matched_count,
    )

    recent_activities = [
        UserActivityResponse.model_validate(act) for act in activities[:15]
    ]

    return ProfileDashboardResponse(
        user=UserResponse.model_validate(current_user),
        stats=stats,
        recent_submissions=recent_submissions,
        recent_activities=recent_activities,
    )


@router.post("/activity", response_model=UserActivityResponse, status_code=status.HTTP_201_CREATED)
def record_activity(
    payload: UserActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Directly records an activity event for the authenticated user.
    """
    activity = UserActivity(
        user_id=current_user.id,
        activity_type=payload.activity_type,
        title=payload.title,
        status=payload.status,
        metadata_json=payload.metadata_json or {},
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return UserActivityResponse.model_validate(activity)
