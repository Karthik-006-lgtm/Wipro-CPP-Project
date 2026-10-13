from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from app.core.database import get_db
from app.models.preparation_record import PreparationRecord
from app.models.user import User, UserActivity
from app.api.deps import get_current_user_optional
from app.schemas.record import (
    PreparationRecordCreate,
    PreparationRecordResponse,
    PreparationRecordListResponse,
    PRACTICE_TYPES,
)

router = APIRouter()


def _handle_db_error(exc: Exception) -> None:
    """Provides a sanitized, helpful 503 error message if database is unreachable."""
    if isinstance(exc, OperationalError) or "connection" in str(exc).lower() or "authentication" in str(exc).lower():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database is unreachable or unconfigured. "
                "To enable persistent preparation records, configure DATABASE_URL in backend/.env."
            ),
        )
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="A database error occurred while processing the preparation record request.",
    )


@router.post("/", response_model=PreparationRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    record_in: PreparationRecordCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Persists a new completed or drafted practice session activity.
    Only stores verified fields from the relevant domain.
    """
    try:
        record = PreparationRecord(
            user_id=current_user.id if current_user else None,
            practice_type=record_in.practice_type,
            title=record_in.title,
            category=record_in.category,
            status=record_in.status,
            summary=record_in.summary,
            score=record_in.score,
            session_metadata=record_in.session_metadata,
        )
        db.add(record)

        if current_user:
            # Map practice_type to activity_type
            activity_type_map = {
                "coding": "coding_submit",
                "architecture": "company_drill",
                "company": "company_drill",
                "behavioral": "video_practice",
                "video": "video_practice",
            }
            act_type = activity_type_map.get(record_in.practice_type, "practice_drill")
            activity = UserActivity(
                user_id=current_user.id,
                activity_type=act_type,
                title=record_in.title,
                status="completed",
                metadata_json={
                    "practice_type": record_in.practice_type,
                    "category": record_in.category,
                    "score": record_in.score,
                },
            )
            db.add(activity)

        db.commit()
        db.refresh(record)
        return record
    except Exception as exc:
        db.rollback()
        _handle_db_error(exc)


@router.get("/", response_model=PreparationRecordListResponse)
def list_records(
    practice_type: Optional[str] = Query(None, description="Filter by domain (coding, architecture, company, behavioral, video)"),
    limit: int = Query(50, ge=1, le=100, description="Page size limit"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
):
    """
    Lists persisted preparation records with optional domain filter and pagination.
    """
    if practice_type and practice_type.lower() != "all" and practice_type.lower() not in PRACTICE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid practice_type: '{practice_type}'. Allowed types are: {', '.join(PRACTICE_TYPES)}",
        )

    try:
        query = db.query(PreparationRecord)
        if practice_type and practice_type.lower() != "all":
            query = query.filter(PreparationRecord.practice_type == practice_type.lower())

        total = query.count()
        items = query.order_by(PreparationRecord.created_at.desc()).offset(offset).limit(limit).all()

        return PreparationRecordListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )
    except Exception as exc:
        _handle_db_error(exc)


@router.get("/{record_id}", response_model=PreparationRecordResponse)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieves a single preparation record by ID.
    """
    try:
        record = db.query(PreparationRecord).filter(PreparationRecord.id == record_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Preparation record with ID {record_id} was not found.",
            )
        return record
    except HTTPException:
        raise
    except Exception as exc:
        _handle_db_error(exc)


@router.delete("/{record_id}")
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    """
    Deletes a preparation record by ID.
    """
    try:
        record = db.query(PreparationRecord).filter(PreparationRecord.id == record_id).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Preparation record with ID {record_id} was not found.",
            )
        db.delete(record)
        db.commit()
        return {
            "success": True,
            "message": "Preparation record deleted successfully.",
            "id": record_id,
        }
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        _handle_db_error(exc)
