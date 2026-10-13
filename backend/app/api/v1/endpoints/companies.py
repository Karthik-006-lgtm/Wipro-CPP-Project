from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserActivity
from app.api.deps import get_current_user_optional

from app.schemas.company import (
    CompanyProfile,
    CompanyListResponse,
    CompanyMatchRequest,
    CompanyMatchResponse,
)
from app.services.company_service import (
    list_companies,
    get_company_by_id,
    match_companies_by_skills,
)

router = APIRouter()


@router.get(
    "/",
    response_model=CompanyListResponse,
    summary="List verified company profiles with optional search",
)
def get_companies(
    q: Optional[str] = Query(None, description="Search by company name, industry, or tech stack"),
) -> CompanyListResponse:
    """
    Returns catalogue companies. Can be filtered by name, technology stack, or industry.
    Distinguishes catalogue profiles from live job openings.
    """
    items = list_companies(query=q)
    return CompanyListResponse(items=items, companies=items, total=len(items))


@router.get(
    "/{company_id}",
    response_model=CompanyProfile,
    summary="Get single company profile by slug",
)
def get_company(company_id: str) -> CompanyProfile:
    """
    Retrieves full hiring specifications, tech stack, and interview stages for a single verified company.
    """
    company = get_company_by_id(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company profile '{company_id}' was not found in the verified catalogue.",
        )
    return company


@router.post(
    "/match",
    response_model=CompanyMatchResponse,
    summary="Match candidate resume skills against company tech stacks",
)
def match_skills(
    request: CompanyMatchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> CompanyMatchResponse:
    """
    Takes extracted candidate competencies (from Section 2 Resume Parser) and computes
    skill compatibility across all verified catalogue employers.
    """
    result = match_companies_by_skills(request.skills)
    if current_user:
        try:
            act = UserActivity(
                user_id=current_user.id,
                activity_type="company_match",
                title="Company Skills Match",
                status="completed",
                metadata_json={
                    "skills_count": len(request.skills),
                    "matched_companies_count": len(result.matches),
                },
            )
            db.add(act)
            db.commit()
        except Exception:
            db.rollback()
    return result

