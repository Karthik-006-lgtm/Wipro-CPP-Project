from typing import List, Optional
from pydantic import BaseModel, Field


class CompanyProfile(BaseModel):
    id: str = Field(..., description="Unique company slug/identifier")
    name: str = Field(..., description="Official company name")
    industry: str = Field(..., description="Industry sector (e.g. Cloud Infrastructure, Enterprise IT)")
    location: str = Field(..., description="Primary locations or Remote availability")
    description: str = Field(..., description="Factual overview of engineering focus")
    tech_stack: List[str] = Field(default_factory=list, description="Verified engineering languages and frameworks")
    roles: List[str] = Field(default_factory=list, description="Typical engineering role categories")
    interview_stages: List[str] = Field(default_factory=list, description="Standard assessment stages")
    website: Optional[str] = Field(None, description="Official company careers or corporate website URL")


class CompanyListResponse(BaseModel):
    items: List[CompanyProfile] = Field(..., description="List of company profiles")
    companies: Optional[List[CompanyProfile]] = Field(None, description="Alias matching frontend expectations")
    total: int = Field(..., description="Total count of returned companies")


class CompanyMatchRequest(BaseModel):
    skills: List[str] = Field(default_factory=list, description="Extracted candidate skills to match against")


class CompanyMatchResult(BaseModel):
    company: CompanyProfile
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    match_percentage: int = Field(..., description="Overall skill match percentage (0-100)")
    match_score: Optional[int] = Field(None, description="Alias for match_percentage")
    recommended_roles: List[str] = Field(default_factory=list)


class CompanyMatchResponse(BaseModel):
    items: List[CompanyMatchResult] = Field(..., description="Ranked list of matching companies")
    matches: Optional[List[CompanyMatchResult]] = Field(None, description="Alias matching frontend expectations")
    total: int
    total_matches: Optional[int] = None
    total_input_skills: int
