from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserActivity
from app.api.deps import get_current_user_optional
from app.schemas.coding import (
    CodeExecutionRequest,
    CodeExecutionResponse,
    CodeSubmitRequest,
    CodeSubmitResponse,
    CodingLanguage,
    CodingProblem,
)
from app.services.coding_service import (
    SUPPORTED_LANGUAGES,
    SAMPLE_CODING_PROBLEMS,
    execute_code,
    submit_code,
    get_service_status,
)
from app.services.problem_repository import (
    filter_problems,
    get_all_topics,
    get_problem_by_id,
)

router = APIRouter()


@router.get("/status", response_model=Dict[str, Any])
async def get_judge0_status():
    """Returns current Judge0 remote sandbox configuration status."""
    return get_service_status()


@router.get("/languages", response_model=List[CodingLanguage])
async def get_coding_languages():
    """Returns supported coding languages, runtimes, and starter templates."""
    return SUPPORTED_LANGUAGES


@router.get("/topics", response_model=List[str])
async def get_coding_topics():
    """Returns structured topic categories for coding practice (LeetCode style)."""
    return get_all_topics()


@router.get("/problems", response_model=List[CodingProblem])
async def get_coding_problems(
    category: Optional[str] = Query(None, description="Filter by topic category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty ('Easy', 'Medium', 'Hard')"),
    search: Optional[str] = Query(None, description="Search keyword in title, description, or topic"),
):
    """Returns curated algorithmic coding problems filtered by topic, difficulty, or search query."""
    return filter_problems(category=category, difficulty=difficulty, search=search)


@router.post("/execute", response_model=CodeExecutionResponse)
async def run_code(
    request: CodeExecutionRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Submits source code and custom standard input to the execution sandbox.
    Returns standard output, stderr, compiler output, execution duration, and exit codes.
    """
    try:
        result = await execute_code(
            source_code=request.source_code,
            language_id=request.language_id,
            stdin=request.stdin,
        )
        if current_user:
            try:
                act = UserActivity(
                    user_id=current_user.id,
                    activity_type="coding_run",
                    title="Code Execution Run",
                    status="passed" if result.status_id == 3 else "error",
                    metadata_json={
                        "language_id": request.language_id,
                        "status_id": result.status_id,
                        "status_description": result.status_description,
                    },
                )
                db.add(act)
                db.commit()
            except Exception:
                db.rollback()

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error processing code execution request: {str(e)}",
        )


@router.post("/submit", response_model=CodeSubmitResponse)
async def submit_code_solution(
    request: CodeSubmitRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Evaluates user code against all test cases for the specified problem.
    Returns passed/failed counts, individual test case diffs, and overall evaluation verdict.
    """
    try:
        result = await submit_code(
            source_code=request.source_code,
            language_id=request.language_id,
            problem_id=request.problem_id,
        )
        if current_user:
            try:
                problem = get_problem_by_id(request.problem_id)
                prob_title = problem.title if problem else f"Problem {request.problem_id}"
                prob_diff = problem.difficulty if problem else "Medium"
                prob_topic = problem.category if problem else "General"

                act = UserActivity(
                    user_id=current_user.id,
                    activity_type="coding_submit",
                    title=prob_title,
                    status="accepted" if result.all_passed else "failed",
                    metadata_json={
                        "problem_id": request.problem_id,
                        "difficulty": prob_diff,
                        "topic": prob_topic,
                        "passed_test_cases": result.passed_test_cases,
                        "total_test_cases": result.total_test_cases,
                        "verdict": result.verdict,
                    },
                )
                db.add(act)
                db.commit()
            except Exception:
                db.rollback()

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error submitting code solution: {str(e)}",
        )

