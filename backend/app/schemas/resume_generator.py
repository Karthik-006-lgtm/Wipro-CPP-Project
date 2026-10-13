from typing import List, Optional
from pydantic import BaseModel, Field


class PersonalInfo(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120, description="Full candidate name")
    email: str = Field(..., min_length=3, max_length=120, description="Contact email address")
    phone: Optional[str] = Field(default="", max_length=50, description="Contact phone number")
    location: Optional[str] = Field(default="", max_length=120, description="City, State / Country")
    title: Optional[str] = Field(default="", max_length=120, description="Target job title or profession")
    linkedin: Optional[str] = Field(default="", max_length=200, description="LinkedIn profile URL or handle")
    github: Optional[str] = Field(default="", max_length=200, description="GitHub profile URL or handle")
    portfolio: Optional[str] = Field(default="", max_length=200, description="Personal website or portfolio link")


class SkillGroup(BaseModel):
    category: str = Field(..., min_length=1, max_length=80, description="Skill group header, e.g. Languages or Cloud")
    skills: List[str] = Field(default_factory=list, description="List of technical skills in this group")


class EducationEntry(BaseModel):
    institution: str = Field(..., min_length=1, max_length=160, description="University or educational institution")
    degree: str = Field(..., min_length=1, max_length=160, description="Degree or diploma, e.g. B.S. in Computer Science")
    start_date: Optional[str] = Field(default="", max_length=50, description="Start date (e.g. Sep 2018)")
    end_date: Optional[str] = Field(default="", max_length=50, description="End date or Expected date (e.g. May 2022)")
    gpa_or_honors: Optional[str] = Field(default="", max_length=100, description="GPA, honors, or distinction")
    details: Optional[str] = Field(default="", max_length=500, description="Relevant coursework or activities")


class ExperienceEntry(BaseModel):
    organization: str = Field(..., min_length=1, max_length=160, description="Company or organization name")
    role: str = Field(..., min_length=1, max_length=160, description="Job title / position")
    location: Optional[str] = Field(default="", max_length=120, description="City, State or Remote")
    start_date: Optional[str] = Field(default="", max_length=50, description="Employment start date")
    end_date: Optional[str] = Field(default="", max_length=50, description="Employment end date or Present")
    current: bool = Field(default=False, description="Whether this is the current job")
    responsibilities: List[str] = Field(default_factory=list, description="Key accomplishments and bullet points")


class ProjectEntry(BaseModel):
    title: str = Field(..., min_length=1, max_length=160, description="Project title")
    description: Optional[str] = Field(default="", max_length=500, description="Summary of project purpose")
    technologies: List[str] = Field(default_factory=list, description="Tools and technologies utilized")
    contributions: List[str] = Field(default_factory=list, description="Bullet points detailing achievements")
    link: Optional[str] = Field(default="", max_length=200, description="Repository or live demonstration link")


class CertificationEntry(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Certificate or achievement name")
    issuer: Optional[str] = Field(default="", max_length=160, description="Issuing authority or organization")
    date: Optional[str] = Field(default="", max_length=50, description="Issue date or validity")
    credential_url_or_id: Optional[str] = Field(default="", max_length=200, description="Credential ID or verification link")


class CustomSection(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Custom section heading")
    items: List[str] = Field(default_factory=list, description="Items or bullet points in this custom section")


class ResumeGeneratorRequest(BaseModel):
    template_id: str = Field(
        default="classic_professional",
        description="Template identifier: 'classic_professional' or 'modern_technical'",
    )
    personal_info: PersonalInfo
    summary: Optional[str] = Field(default="", max_length=2500, description="Professional summary or objective statement")
    skill_groups: List[SkillGroup] = Field(default_factory=list, description="Categorized skill lists")
    education: List[EducationEntry] = Field(default_factory=list, description="Academic history")
    experience: List[ExperienceEntry] = Field(default_factory=list, description="Professional work experience")
    projects: List[ProjectEntry] = Field(default_factory=list, description="Featured technical projects")
    certifications: List[CertificationEntry] = Field(default_factory=list, description="Certifications and awards")
    custom_sections: List[CustomSection] = Field(default_factory=list, description="Optional custom sections")


class ResumePreviewResponse(BaseModel):
    valid: bool
    template_id: str
    candidate_name: str
    target_role: Optional[str] = None
    section_counts: dict
    validation_warnings: List[str] = Field(default_factory=list)
