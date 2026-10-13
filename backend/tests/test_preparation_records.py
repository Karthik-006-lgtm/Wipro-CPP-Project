import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db
from app.models.preparation_record import PreparationRecord

# Isolated in-memory SQLite database specifically for test verification
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Creates a clean in-memory database schema for each test."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Provides a TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_list_records_empty_database(client):
    response = client.get("/api/v1/records/")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["limit"] == 50
    assert data["offset"] == 0


def test_create_and_get_coding_record(client):
    payload = {
        "practice_type": "coding",
        "title": "1. Two Sum Indices",
        "category": "Arrays & Hash Maps",
        "status": "completed",
        "summary": "Solved with hash map in O(n) time. Local edit test.",
        "score": None,
        "session_metadata": {
            "problem_id": "two-sum",
            "language": "python",
            "language_id": 71,
            "source_code": "def two_sum(): ...",
            "execution_status": "local_draft",
            "stdout": None,
        },
    }

    create_res = client.post("/api/v1/records/", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["id"] is not None
    assert created_data["practice_type"] == "coding"
    assert created_data["title"] == "1. Two Sum Indices"
    assert created_data["session_metadata"]["execution_status"] == "local_draft"

    # Get by ID
    get_res = client.get(f"/api/v1/records/{created_data['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "1. Two Sum Indices"


def test_create_architecture_record(client):
    payload = {
        "practice_type": "architecture",
        "title": "URL Shortener Distributed Architecture",
        "category": "Distributed Systems",
        "status": "structured",
        "summary": "100M URLs/month with Redis LRU cache and Postgres sharding.",
        "score": 85,
        "session_metadata": {
            "scenario_id": "url-shortener",
            "scope": "100M URLs monthly",
            "high_level_design": "DNS -> ALB -> Microservices -> Redis/Postgres",
            "readiness_level": "Comprehensive",
            "pillars_covered": ["Capacity & Latency SLAs", "Caching Tier", "Database Architecture"],
        },
    }

    create_res = client.post("/api/v1/records/", json=payload)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["score"] == 85
    assert data["practice_type"] == "architecture"


def test_create_star_record(client):
    payload = {
        "practice_type": "behavioral",
        "title": "Production Incident Recovery",
        "category": "STAR Method",
        "status": "structured",
        "summary": "Restored DB connection pool during Black Friday surge.",
        "score": 90,
        "session_metadata": {
            "question": "Tell me about a production failure",
            "situation": "Latency spike during holiday traffic",
            "task": "Diagnose within 15min SLA",
            "action": "Scaled PgBouncer and added Redis replica",
            "result": "Latency recovered to 85ms",
        },
    }

    create_res = client.post("/api/v1/records/", json=payload)
    assert create_res.status_code == 201
    assert create_res.json()["score"] == 90


def test_create_video_session_metadata_record(client):
    payload = {
        "practice_type": "video",
        "title": "2-Minute Technical Elevator Pitch",
        "category": "Live Speech Delivery",
        "status": "completed",
        "summary": "95s technical pitch at ~140 wpm cadence.",
        "score": None,
        "session_metadata": {
            "duration_seconds": 95.0,
            "duration_formatted": "01:35",
            "recorded_format": "video/webm;codecs=vp9",
            "user_transcript": "I am a full stack engineer...",
            "notes": ["Recorded locally in browser. No raw video uploaded."],
        },
    }

    create_res = client.post("/api/v1/records/", json=payload)
    assert create_res.status_code == 201
    assert create_res.json()["practice_type"] == "video"


def test_filter_records_by_practice_type(client):
    # Insert coding record
    client.post(
        "/api/v1/records/",
        json={
            "practice_type": "coding",
            "title": "Coding Problem A",
            "status": "completed",
            "session_metadata": {},
        },
    )
    # Insert behavioral record
    client.post(
        "/api/v1/records/",
        json={
            "practice_type": "behavioral",
            "title": "STAR Problem B",
            "status": "completed",
            "session_metadata": {},
        },
    )

    # Filter by coding
    coding_res = client.get("/api/v1/records/?practice_type=coding")
    assert coding_res.status_code == 200
    data = coding_res.json()
    assert data["total"] == 1
    assert data["items"][0]["practice_type"] == "coding"

    # Filter by all
    all_res = client.get("/api/v1/records/?practice_type=all")
    assert all_res.status_code == 200
    assert all_res.json()["total"] == 2


def test_get_record_not_found(client):
    response = client.get("/api/v1/records/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_delete_record(client):
    create_res = client.post(
        "/api/v1/records/",
        json={
            "practice_type": "company",
            "title": "Cloud Infrastructure Drill",
            "status": "completed",
            "session_metadata": {},
        },
    )
    record_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/records/{record_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Ensure it's gone
    get_res = client.get(f"/api/v1/records/{record_id}")
    assert get_res.status_code == 404


def test_delete_record_not_found(client):
    del_res = client.delete("/api/v1/records/888888")
    assert del_res.status_code == 404


def test_invalid_practice_type(client):
    response = client.get("/api/v1/records/?practice_type=invalid_type_name")
    assert response.status_code == 400
    assert "Invalid practice_type" in response.json()["detail"]


def test_database_connection_failure_returns_503():
    """When database query fails due to connectivity error, endpoint returns 503."""
    from unittest.mock import MagicMock
    from sqlalchemy.exc import OperationalError
    from app.core.database import get_db

    mock_db = MagicMock()
    mock_db.query.side_effect = OperationalError("connection refused", {}, Exception())
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with TestClient(app) as raw_client:
            response = raw_client.get("/api/v1/records/")
            assert response.status_code == 503
            data = response.json()
            assert "unreachable or unconfigured" in data["detail"].lower()
    finally:
        app.dependency_overrides.clear()
