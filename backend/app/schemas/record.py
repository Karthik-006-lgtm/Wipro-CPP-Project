from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


PRACTICE_TYPES = ("coding", "architecture", "company", "behavioral", "video")


class PreparationRecordBase(BaseModel):
    practice_type: Literal["coding", "architecture", "company", "behavioral", "video"] = Field(
        ...,
        description="Category of the practice session (coding, architecture, company, behavioral, video)",
    )
    title: str = Field(..., min_length=1, max_length=255, description="Session drill or scenario title")
    category: Optional[str] = Field(None, max_length=100, description="Domain sub-category")
    status: str = Field(
        default="completed",
        max_length=50,
        description="Session completion or evaluation status (completed, draft, structured, etc.)",
    )
    summary: Optional[str] = Field(None, max_length=1000, description="Brief summary of results")
    score: Optional[int] = Field(None, ge=0, le=100, description="Evaluated score or completeness rating (0-100)")
    session_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Detailed structured domain session data (code, STAR responses, architecture pillars, metrics)",
    )


class PreparationRecordCreate(PreparationRecordBase):
    pass


class PreparationRecordResponse(PreparationRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PreparationRecordListResponse(BaseModel):
    items: List[PreparationRecordResponse]
    total: int
    limit: int
    offset: int
