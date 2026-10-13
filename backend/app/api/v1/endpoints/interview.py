from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserActivity
from app.api.deps import get_current_user_optional
from app.schemas.interview import (
    StarEvaluationRequest,
    StarEvaluationResponse,
    ArchitectureEvaluationRequest,
    ArchitectureEvaluationResponse,
    VideoAuditRequest,
    VideoAuditResponse,
)
from app.services.interview_service import (
    evaluate_star_framework,
    evaluate_architecture_design,
    audit_video_session,
)

router = APIRouter()


@router.post("/behavioral/evaluate", response_model=StarEvaluationResponse)
async def evaluate_behavioral(
    request: StarEvaluationRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Evaluates STAR behavioral answer structure against completeness rubrics."""
    result = evaluate_star_framework(request)
    if current_user:
        try:
            act = UserActivity(
                user_id=current_user.id,
                activity_type="video_practice",
                title=f"Behavioral STAR Drill: {request.scenario_title or 'General Practice'}",
                status="completed",
                metadata_json={"score": result.overall_score, "rubric": result.rubric_breakdown},
            )
            db.add(act)
            db.commit()
        except Exception:
            db.rollback()
    return result


@router.post("/architecture/evaluate", response_model=ArchitectureEvaluationResponse)
async def evaluate_architecture(
    request: ArchitectureEvaluationRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Evaluates written systems architecture against core distributed engineering pillars."""
    result = evaluate_architecture_design(request)
    if current_user:
        try:
            act = UserActivity(
                user_id=current_user.id,
                activity_type="company_drill",
                title=f"Architecture Review: {request.system_name or 'System Design'}",
                status="completed",
                metadata_json={"pillars": result.pillars_covered, "score": result.readiness_rating},
            )
            db.add(act)
            db.commit()
        except Exception:
            db.rollback()
    return result


@router.post("/video/audit", response_model=VideoAuditResponse)
async def audit_video(
    request: VideoAuditRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Audits browser video recording technical metrics and reports AI gateway status."""
    result = audit_video_session(request)
    if current_user:
        try:
            act = UserActivity(
                user_id=current_user.id,
                activity_type="video_practice",
                title="Mock Video Interview Audit",
                status="completed",
                metadata_json={"duration_seconds": request.duration_seconds, "fps": request.frame_rate},
            )
            db.add(act)
            db.commit()
        except Exception:
            db.rollback()
    return result
