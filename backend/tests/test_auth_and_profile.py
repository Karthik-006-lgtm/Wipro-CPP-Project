import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password, verify_password

# Isolated in-memory SQLite database for test verification
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


def test_password_hashing():
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_register_and_duplicate_email(client):
    payload = {
        "email": "candidate@example.com",
        "full_name": "Test Candidate",
        "password": "Password12345",
    }
    # 1. First registration succeeds
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == "candidate@example.com"
    assert data["user"]["full_name"] == "Test Candidate"

    # 2. Duplicate registration returns 409 Conflict with EMAIL_ALREADY_EXISTS code
    res_dup = client.post("/api/v1/auth/register", json=payload)
    assert res_dup.status_code == 409
    err = res_dup.json()["detail"]
    assert err["code"] == "EMAIL_ALREADY_EXISTS"
    assert err["email"] == "candidate@example.com"


def test_login_success_and_failure(client):
    # Register candidate
    client.post("/api/v1/auth/register", json={
        "email": "alice@example.com",
        "full_name": "Alice Smith",
        "password": "CorrectPassword123",
    })

    # Wrong password -> 401
    res_fail = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com",
        "password": "WrongPassword123",
    })
    assert res_fail.status_code == 401

    # Nonexistent email -> 401
    res_no_user = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "CorrectPassword123",
    })
    assert res_no_user.status_code == 401

    # Valid credentials -> 200 with Bearer token
    res_ok = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com",
        "password": "CorrectPassword123",
    })
    assert res_ok.status_code == 200
    assert "token" in res_ok.json()
    assert res_ok.json()["user"]["email"] == "alice@example.com"


def test_authenticated_me_and_logout(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "bob@example.com",
        "full_name": "Bob Builder",
        "password": "Password123",
    }).json()
    token = reg["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Access /me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "bob@example.com"

    # Unauthorized access without token
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # Subsequent access with old token should now fail
    after_logout_res = client.get("/api/v1/auth/me", headers=headers)
    assert after_logout_res.status_code == 401


def test_forgot_and_reset_password_flow(client):
    # Register user
    client.post("/api/v1/auth/register", json={
        "email": "recovery@example.com",
        "full_name": "Recovery User",
        "password": "OldPassword123",
    })

    # Request forgot password
    forgot_res = client.post("/api/v1/auth/forgot-password", json={
        "email": "recovery@example.com",
    })
    assert forgot_res.status_code == 200
    forgot_data = forgot_res.json()
    token = forgot_data.get("reset_token")
    assert token is not None

    # Reset password with token
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "token": token,
        "new_password": "BrandNewPassword456",
    })
    assert reset_res.status_code == 200
    new_token = reset_res.json()["token"]
    assert new_token is not None

    # Verify old password fails
    fail_login = client.post("/api/v1/auth/login", json={
        "email": "recovery@example.com",
        "password": "OldPassword123",
    })
    assert fail_login.status_code == 401

    # Verify new password succeeds
    ok_login = client.post("/api/v1/auth/login", json={
        "email": "recovery@example.com",
        "password": "BrandNewPassword456",
    })
    assert ok_login.status_code == 200


def test_profile_update_and_activity_dashboard(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "profile@example.com",
        "full_name": "Profile Owner",
        "password": "Password123",
    }).json()
    token = reg["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile links
    up_res = client.put("/api/v1/profile/", json={
        "full_name": "Profile Owner Updated",
        "github_url": "https://github.com/profileowner",
        "linkedin_url": "https://linkedin.com/in/profileowner",
    }, headers=headers)
    assert up_res.status_code == 200
    assert up_res.json()["full_name"] == "Profile Owner Updated"
    assert up_res.json()["github_url"] == "https://github.com/profileowner"

    # Record activity
    act_res = client.post("/api/v1/profile/activity", json={
        "activity_type": "coding_submit",
        "title": "Two Sum",
        "status": "accepted",
        "metadata_json": {
            "problem_id": "two-sum",
            "difficulty": "Easy",
            "topic": "Arrays",
        },
    }, headers=headers)
    assert act_res.status_code == 201

    # Fetch activity dashboard
    dash_res = client.get("/api/v1/profile/activity", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["stats"]["total_activities"] >= 1
    assert dash_data["stats"]["coding_accepted_today"] >= 1
    assert dash_data["stats"]["difficulty_breakdown"]["Easy"] >= 1
    assert "Arrays" in dash_data["stats"]["topics_explored"]
