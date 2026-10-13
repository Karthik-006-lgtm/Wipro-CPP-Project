from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, profile, resumes, coding, interview, records, assistant, companies

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
api_router.include_router(coding.router, prefix="/coding", tags=["Coding"])
api_router.include_router(interview.router, prefix="/interview", tags=["Interview"])
api_router.include_router(records.router, prefix="/records", tags=["Records"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["Assistant"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])


