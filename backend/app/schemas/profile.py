from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.auth import UserResponse


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    github_url: Optional[str] = Field(None, max_length=512)
    linkedin_url: Optional[str] = Field(None, max_length=512)


class UserActivityCreate(BaseModel):
    activity_type: str = Field(..., max_length=50)
    title: str = Field(..., max_length=255)
    status: str = Field(default="completed", max_length=50)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class UserActivityResponse(BaseModel):
    id: int
    user_id: int
    activity_type: str
    title: str
    status: str
    metadata_json: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileSummaryStats(BaseModel):
    total_activities: int = 0
    coding_runs_today: int = 0
    coding_accepted_today: int = 0
    difficulty_breakdown: Dict[str, int] = Field(default_factory=lambda: {"Easy": 0, "Medium": 0, "Hard": 0})
    topics_explored: List[str] = Field(default_factory=list)
    interview_drills_count: int = 0
    resumes_parsed_count: int = 0
    resumes_generated_count: int = 0
    companies_matched_count: int = 0


class ProfileDashboardResponse(BaseModel):
    user: UserResponse
    stats: ProfileSummaryStats
    recent_submissions: List[UserActivityResponse] = Field(default_factory=list)
    recent_activities: List[UserActivityResponse] = Field(default_factory=list)
