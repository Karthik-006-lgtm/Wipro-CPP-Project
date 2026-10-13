from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.core.database import check_database_health
from app.schemas.health import HealthCheckResponse, DatabaseHealth

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse, summary="Application and dependency health check")
def get_health() -> HealthCheckResponse:
    """
    Returns API health status, server timestamp, and database connectivity.
    Ensures no passwords, secrets, or internal server paths are exposed.
    """
    db_report = check_database_health()
    return HealthCheckResponse(
        status="ok",
        app_name=settings.APP_NAME,
        environment=settings.APP_ENV,
        version="0.1.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
        database=DatabaseHealth(
            status=db_report["status"],
            connected=db_report["connected"],
            message=db_report["message"],
            latency_ms=db_report["latency_ms"],
        ),
    )
