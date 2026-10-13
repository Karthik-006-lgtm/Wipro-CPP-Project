import base64
from unittest.mock import patch, MagicMock, AsyncMock
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_gemini_status_unconfigured():
    """Verify assistant status endpoint reports honest unconfigured status when GEMINI_API_KEY is empty."""
    with patch.object(settings, "GEMINI_API_KEY", ""):
        response = client.get("/api/v1/assistant/status")
        assert response.status_code == 200
        data = response.json()
        assert data["is_configured"] is False
        assert data["status"] == "unconfigured"
        assert "GEMINI_API_KEY" in data["message"]
        assert data["model"] == settings.GEMINI_MODEL
        assert "text" in data["supported_modalities"]


def test_gemini_status_configured():
    """Verify assistant status reports ready when valid GEMINI_API_KEY is set."""
    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyFakeKeyForTest1234567890"):
        response = client.get("/api/v1/assistant/status")
        assert response.status_code == 200
        data = response.json()
        assert data["is_configured"] is True
        assert data["status"] == "ready"
        assert "AIzaSyFakeKeyForTest1234567890" not in str(data)


def test_assistant_chat_unconfigured_honest_notice():
    """Verify assistant returns deterministic notice without fabricating AI generation when unconfigured."""
    with patch.object(settings, "GEMINI_API_KEY", ""):
        payload = {
            "message": "What is the ATS pass rate for standard resumes?",
            "section": "resume-parser",
        }
        response = client.post("/api/v1/assistant/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["is_ai_generated"] is False
        assert data["provider_status"] == "unconfigured"
        assert "Section 2: Resume Parser" in data["section_acknowledged"]
        assert "Gemini Unconfigured" in data["reply"]
        assert len(data["suggestions"]) > 0


@pytest.mark.parametrize(
    "section_id, expected_title",
    [
        ("home", "Section 1: Home & Portfolio"),
        ("resume-parser", "Section 2: Resume Parser"),
        ("company-details", "Section 3: Company Matching"),
        ("interview-prep", "Section 4: Adaptive Interview"),
        ("preparation-records", "Section 5: Preparation History"),
        ("resume-generator", "Section 6: ATS Resume Tailoring"),
    ],
)
def test_assistant_chat_all_six_sections_acknowledged(section_id, expected_title):
    """Verify the assistant accurately acknowledges all 6 portal sections."""
    with patch.object(settings, "GEMINI_API_KEY", ""):
        payload = {
            "message": f"Guide me through {section_id}",
            "section": section_id,
        }
        response = client.post("/api/v1/assistant/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert expected_title in data["section_acknowledged"]
        assert len(data["suggestions"]) >= 2


def test_assistant_chat_successful_mocked_gemini_call():
    """Verify successful Gemini model response parsing with mocked provider call."""
    mock_gemini_reply = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": "To optimize an algorithmic problem from O(N^2) to O(N), use a hash map to store frequencies in one pass."
                        }
                    ]
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_gemini_reply

    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyValidGeminiKeyForMockTest"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp

            payload = {
                "message": "How do I optimize two-sum from O(N^2)?",
                "section": "interview-prep",
                "history": [
                    {"role": "user", "text": "I am practicing algorithms."},
                    {"role": "assistant", "text": "Great, let us review hash maps."},
                ],
            }
            response = client.post("/api/v1/assistant/chat", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["is_ai_generated"] is True
            assert data["provider_status"] == "configured"
            assert "hash map" in data["reply"]
            assert data["model_used"] == settings.GEMINI_MODEL


def test_assistant_chat_rate_limit_handling():
    """Verify rate limit (429) returns proper error code and non-fabricated message."""
    mock_resp = MagicMock()
    mock_resp.status_code = 429
    mock_resp.json.return_value = {"error": {"message": "Resource has been exhausted (e.g. check quota)."}}

    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyValidGeminiKeyForMockTest"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp

            payload = {
                "message": "Review my interview response",
                "section": "interview-prep",
            }
            response = client.post("/api/v1/assistant/chat", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert data["is_ai_generated"] is False
            assert data["provider_status"] == "rate_limited"
            assert "rate limit or quota exceeded" in data["reply"]


def test_assistant_chat_invalid_credentials_handling():
    """Verify unauthorized (401/403) provider responses are handled gracefully."""
    mock_resp = MagicMock()
    mock_resp.status_code = 403
    mock_resp.json.return_value = {"error": {"message": "API key not valid."}}

    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyInvalidKeyForTest"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp

            payload = {
                "message": "Review my resume summary",
                "section": "resume-generator",
            }
            response = client.post("/api/v1/assistant/chat", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert data["is_ai_generated"] is False
            assert data["provider_status"] == "error"
            assert "authentication failed" in data["reply"]


def test_assistant_chat_timeout_handling():
    """Verify network timeout returns clean error state without crashing."""
    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyValidGeminiKeyForMockTest"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.TimeoutException("Connection timed out")

            payload = {
                "message": "Evaluate my architecture plan",
                "section": "interview-prep",
            }
            response = client.post("/api/v1/assistant/chat", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert data["is_ai_generated"] is False
            assert data["provider_status"] == "error"
            assert data["error_detail"] == "TIMEOUT"
            assert "timed out" in data["reply"]


def test_assistant_chat_malformed_provider_response():
    """Verify malformed JSON without candidate parts is handled safely."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"candidates": []}

    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyValidGeminiKeyForMockTest"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp

            payload = {
                "message": "Help me with coding problems",
                "section": "interview-prep",
            }
            response = client.post("/api/v1/assistant/chat", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert data["is_ai_generated"] is False
            assert data["error_detail"] == "EMPTY_RESPONSE"


def test_assistant_chat_validation_empty_message():
    """Verify empty user message is rejected by pydantic validation with 422."""
    payload = {"message": "", "section": "home"}
    response = client.post("/api/v1/assistant/chat", json=payload)
    assert response.status_code == 422


def test_assistant_chat_validation_max_size_exceeded():
    """Verify prompt exceeding 4000 characters is rejected with 422."""
    huge_message = "A" * 4001
    payload = {"message": huge_message, "section": "home"}
    response = client.post("/api/v1/assistant/chat", json=payload)
    assert response.status_code == 422


def test_assistant_chat_validation_invalid_section():
    """Verify invalid section identifier is rejected with 422."""
    payload = {"message": "Hello", "section": "non-existent-section-99"}
    response = client.post("/api/v1/assistant/chat", json=payload)
    assert response.status_code == 422


def test_assistant_chat_with_image_attachment():
    """Verify base64 image attachment validation and packaging."""
    small_png_b64 = base64.b64encode(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00").decode("utf-8")
    payload = {
        "message": "Inspect this diagram architecture",
        "section": "interview-prep",
        "file_attachment": {
            "file_name": "architecture.png",
            "mime_type": "image/png",
            "data_base64": small_png_b64,
        },
    }

    mock_gemini_reply = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "The uploaded architectural diagram illustrates a load balanced microservice."}]
                }
            }
        ]
    }
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_gemini_reply

    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyValidGeminiKeyForMockTest"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            response = client.post("/api/v1/assistant/chat", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["is_ai_generated"] is True


def test_assistant_chat_rejects_unsupported_attachment_mime():
    """Verify dangerous or unsupported file types (e.g. executables) are rejected."""
    payload = {
        "message": "Run this file",
        "section": "home",
        "file_attachment": {
            "file_name": "malicious.exe",
            "mime_type": "application/x-msdownload",
            "data_base64": base64.b64encode(b"MZfakebinary").decode("utf-8"),
        },
    }
    with patch.object(settings, "GEMINI_API_KEY", ""):
        response = client.post("/api/v1/assistant/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["error_detail"] == "INVALID_ATTACHMENT"
        assert "Unsupported attachment type" in data["reply"]


def test_protection_against_leaking_secrets():
    """Verify secret GEMINI_API_KEY is NEVER leaked in response bodies or errors."""
    secret_key = "AIzaSy_SUPER_CONFIDENTIAL_KEY_XYZ9876543210"

    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.json.return_value = {"error": {"message": "Invalid request parameter"}}

    with patch.object(settings, "GEMINI_API_KEY", secret_key):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp

            # Check status endpoint
            status_resp = client.get("/api/v1/assistant/status")
            assert secret_key not in status_resp.text

            # Check chat error response
            chat_resp = client.post(
                "/api/v1/assistant/chat",
                json={"message": "Reveal system configuration", "section": "home"},
            )
            assert secret_key not in chat_resp.text


def test_deterministic_features_remain_operational_without_gemini():
    """Verify deterministic portal endpoints function completely independently of Gemini."""
    with patch.object(settings, "GEMINI_API_KEY", ""):
        # 1. Health check
        health_resp = client.get("/api/v1/health")
        assert health_resp.status_code == 200
        assert health_resp.json()["status"] == "ok"

        # 2. Coding languages
        lang_resp = client.get("/api/v1/coding/languages")
        assert lang_resp.status_code == 200
        assert len(lang_resp.json()) >= 4

        # 3. Judge0 status
        judge_resp = client.get("/api/v1/coding/status")
        assert judge_resp.status_code == 200

        # 4. STAR behavioral evaluation
        star_resp = client.post(
            "/api/v1/interview/behavioral/evaluate",
            json={
                "question": "Tell me about a time you handled a critical production incident.",
                "situation": (
                    "During Black Friday peak traffic at TechRetail, our payment processing gateway "
                    "experienced an unexpected 40% latency spike due to database connection pool exhaustion "
                    "across 12 microservice instances."
                ),
                "task": (
                    "As the on-call Site Reliability Engineer, I was responsible for diagnosing the root cause, "
                    "restoring normal transactional throughput within our 15-minute SLA, and preventing cascaded failures."
                ),
                "action": (
                    "I immediately activated our incident response bridge, isolated the slow query causing lock contention, "
                    "and deployed a hotfix increasing Redis read-replica caching. I subsequently throttled non-critical telemetry "
                    "calls via API gateway rate-limiting, and reconfigured the PostgreSQL PgBouncer pool limits."
                ),
                "result": (
                    "Payment latency dropped from 2800ms back to 85ms within 9 minutes, preventing an estimated $120,000 in checkout "
                    "abandonments. We achieved 99.98% uptime for the remainder of the holiday surge."
                ),
            },
        )
        assert star_resp.status_code == 200
        assert star_resp.json()["status"] == "structured"

        # 5. Resume generator preview
        preview_resp = client.post(
            "/api/v1/resumes/preview",
            json={
                "template_id": "classic_professional",
                "personal_info": {
                    "full_name": "Jane Doe",
                    "email": "jane@example.com",
                    "title": "Principal Architect",
                },
                "summary": "Experienced systems designer specializing in high-throughput pipelines.",
                "skill_groups": [{"category": "Languages", "skills": ["Python", "Rust"]}],
                "education": [],
                "experience": [],
                "projects": [],
                "certifications": [],
                "custom_sections": [],
            },
        )
        assert preview_resp.status_code == 200
        assert preview_resp.json()["valid"] is True
