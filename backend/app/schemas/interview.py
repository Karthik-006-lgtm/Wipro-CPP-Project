from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class StarEvaluationRequest(BaseModel):
    question: str = Field(..., max_length=2000, description="The interview question")
    situation: str = Field(..., max_length=5000, description="Situation context")
    task: str = Field(..., max_length=5000, description="Task assignment or challenge")
    action: str = Field(..., max_length=8000, description="Action taken by candidate")
    result: str = Field(..., max_length=5000, description="Quantified results and impact")


class StarComponentCheck(BaseModel):
    component: str  # 'Situation' | 'Task' | 'Action' | 'Result'
    word_count: int
    status: str     # 'pass' | 'warning' | 'needs_expansion'
    feedback: str


class StarEvaluationResponse(BaseModel):
    completeness_score: int = Field(..., description="Structural completeness index (0-100)")
    status: str             # 'structured' | 'needs_expansion' | 'incomplete'
    components: List[StarComponentCheck]
    suggestions: List[str]
    disclaimer: str


class ArchitectureEvaluationRequest(BaseModel):
    problem_id: str
    requirements_scope: str = Field(..., max_length=4000)
    high_level_design: str = Field(..., max_length=8000)
    data_modeling: str = Field(..., max_length=6000)
    scalability_tradeoffs: str = Field(..., max_length=8000)


class ArchitectureEvaluationResponse(BaseModel):
    structural_score: int
    readiness_level: str  # 'Comprehensive' | 'Adequate' | 'Needs Depth'
    pillars_covered: List[str]
    pillars_to_expand: List[str]
    recommendations: List[str]
    disclaimer: str


class VideoAuditRequest(BaseModel):
    duration_seconds: float = Field(..., ge=0.5, le=900.0)
    recorded_format: str
    sampled_frames_count: Optional[int] = 0
    face_detected_ratio: Optional[float] = None
    transcript_input: Optional[str] = Field(default="", max_length=10000)


class VideoAuditResponse(BaseModel):
    recording_valid: bool
    duration_formatted: str
    stream_quality_notes: List[str]
    transcription_status: str  # 'unconfigured' | 'user_provided' | 'ready'
    ai_feedback_status: str    # 'unconfigured' | 'available'
    rubric_guidelines: List[Dict[str, str]]
    disclaimer: str
