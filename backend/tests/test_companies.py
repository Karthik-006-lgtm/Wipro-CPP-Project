from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_all_companies():
    """Verify listing all verified companies returns catalogue."""
    response = client.get("/api/v1/companies/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "companies" in data
    assert data["total"] >= 50
    ids = [c["id"] for c in data["items"]]
    assert "google" in ids
    assert "microsoft" in ids
    assert "amazon" in ids
    assert "wipro" in ids


def test_search_companies_by_name():
    """Verify company search by name substring."""
    response = client.get("/api/v1/companies/?q=Google")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == "google"


def test_search_companies_by_tech_stack():
    """Verify company search matches technology stack keywords."""
    response = client.get("/api/v1/companies/?q=Kubernetes")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    names = [c["name"] for c in data["items"]]
    assert "Google" in names or "Tata Consultancy Services (TCS)" in names


def test_search_companies_no_match():
    """Verify company search returns honest empty results for unknown query."""
    response = client.get("/api/v1/companies/?q=NonExistentCompanyXYZ999")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0


def test_get_single_company():
    """Verify retrieving a specific company by slug."""
    response = client.get("/api/v1/companies/google")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Google"
    assert "Python" in data["tech_stack"]
    assert len(data["roles"]) > 0
    assert len(data["interview_stages"]) > 0


def test_get_company_not_found():
    """Verify 404 is returned when requesting a non-existent company slug."""
    response = client.get("/api/v1/companies/non-existent-company")
    assert response.status_code == 404
    assert "was not found" in response.json()["detail"]


def test_match_companies_with_skills():
    """Verify matching candidate skills against company tech stacks."""
    payload = {
        "skills": ["Python", "Docker", "AWS", "SQL", "Kubernetes"]
    }
    response = client.post("/api/v1/companies/match", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert data["total_input_skills"] == 5

    # Check top match structure
    first_match = data["items"][0]
    assert "company" in first_match
    assert "matched_skills" in first_match
    assert first_match["match_percentage"] > 0
    assert len(first_match["recommended_roles"]) > 0
    assert any(s in ["Python", "AWS", "SQL", "Docker", "Kubernetes"] for s in first_match["matched_skills"])


def test_match_companies_empty_skills():
    """Verify matching with empty skill list returns empty list cleanly."""
    response = client.post("/api/v1/companies/match", json={"skills": []})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0
