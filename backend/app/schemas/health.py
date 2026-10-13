from typing import Optional
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    status: str = Field(..., description="'connected', 'unreachable', or 'unconfigured'")
    connected: bool = Field(..., description="Whether ping succeeded")
    message: str = Field(..., description="Sanitized status description")
    latency_ms: Optional[float] = Field(None, description="Ping round-trip time in milliseconds")


class HealthCheckResponse(BaseModel):
    status: str = Field("ok", description="Overall backend application status")
    app_name: str = Field(..., description="Application Name")
    environment: str = Field(..., description="Deployment environment")
    version: str = Field("0.1.0", description="API version")
    timestamp: str = Field(..., description="ISO 8601 server timestamp")
    database: DatabaseHealth = Field(..., description="Database connectivity report")
