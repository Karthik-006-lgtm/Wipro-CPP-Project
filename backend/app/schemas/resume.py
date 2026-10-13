from typing import List, Optional
from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    name: Optional[str] = Field(None, description="Confidently detected candidate name")
    email: Optional[str] = Field(None, description="Detected contact email address")
    phone: Optional[str] = Field(None, description="Detected contact telephone number")
    links: List[str] = Field(default_factory=list, description="Detected portfolio or social profiles")


class DetectedSkill(BaseModel):
    raw_term: str = Field(..., description="Matched token from source text")
    normalized_name: str = Field(..., description="Standardized taxonomy skill name")
    category: str = Field(..., description="Technical domain category")
    evidence: str = Field(..., description="Source text snippet containing the match")


class AtsCheck(BaseModel):
    name: str = Field(..., description="Name of the ATS compliance check")
    status: str = Field(..., description="'pass', 'warning', or 'fail'")
    explanation: str = Field(..., description="Evaluation description")
    evidence: Optional[str] = Field(None, description="Specific document evidence found")
    suggested_improvement: Optional[str] = Field(None, description="Actionable suggestion if not passed")


class AtsEvaluation(BaseModel):
    heuristic_score: int = Field(..., description="Transparent rule-based score (0-100)")
    score_disclaimer: str = Field(..., description="Explanation of heuristic methodology")
    checks: List[AtsCheck] = Field(..., description="Individual rule-based checks")


class ResumeMetadata(BaseModel):
    filename: str = Field(..., description="Original upload filename")
    file_format: str = Field(..., description="Detected document format (pdf, docx, txt)")
    file_size_bytes: int = Field(..., description="Document file size in bytes")
    word_count: int = Field(..., description="Total extracted word count")
    char_count: int = Field(..., description="Total extracted character count")
    structural_units: int = Field(..., description="Page or element count")


class ResumeParseResponse(BaseModel):
    success: bool = Field(True, description="Whether parsing succeeded")
    metadata: ResumeMetadata = Field(..., description="Extracted document metadata")
    contact_info: ContactInfo = Field(..., description="Structured contact details")
    sections_detected: List[str] = Field(default_factory=list, description="Recognized standard resume section titles")
    skills: List[DetectedSkill] = Field(default_factory=list, description="Verified technical skills extracted")
    education: List[str] = Field(default_factory=list, description="Identified academic degrees and credentials")
    experience: List[str] = Field(default_factory=list, description="Identified work history chronology markers")
    certifications: List[str] = Field(default_factory=list, description="Identified professional certifications")
    ats_evaluation: AtsEvaluation = Field(..., description="Transparent rule-based ATS checks")
    extracted_text_preview: str = Field(..., description="Sanitized preview of extracted text (first 1000 chars)")
    warnings: List[str] = Field(default_factory=list, description="Parser notifications and unidentifiable items")
