from unittest.mock import patch, AsyncMock
import httpx
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_get_coding_languages():
    response = client.get("/api/v1/coding/languages")
    assert response.status_code == 200
    languages = response.json()
    assert isinstance(languages, list)
    assert len(languages) >= 5
    lang_keys = [lang["key"] for lang in languages]
    assert "python" in lang_keys
    assert "cpp" in lang_keys
    assert "javascript" in lang_keys
    assert "typescript" in lang_keys
    assert "java" in lang_keys


def test_get_coding_problems():
    response = client.get("/api/v1/coding/problems")
    assert response.status_code == 200
    problems = response.json()
    assert len(problems) >= 3
    problem_ids = [p["id"] for p in problems]
    assert "two-sum" in problem_ids
    assert "valid-palindrome" in problem_ids
    assert "reverse-words" in problem_ids


def test_get_judge0_status_unconfigured():
    response = client.get("/api/v1/coding/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_configured" in data
    assert "api_url" in data
    assert "status" in data


def test_execute_code_unsupported_language():
    response = client.post(
        "/api/v1/coding/execute",
        json={"source_code": "print('hello')", "language_id": 99999, "stdin": ""},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert "Unsupported language ID" in data["message"]


def test_execute_code_oversized_payload():
    huge_code = "a" * 70000
    response = client.post(
        "/api/v1/coding/execute",
        json={"source_code": huge_code, "language_id": 71, "stdin": ""},
    )
    # Pydantic max_length validation returns 422
    assert response.status_code == 422


def test_execute_code_when_unconfigured():
    # Without an API key and with local runner disabled, backend must return configuration_missing honestly
    with patch.object(settings, "JUDGE0_API_KEY", ""), patch.object(settings, "ENABLE_LOCAL_CODE_RUNNER", False):
        response = client.post(
            "/api/v1/coding/execute",
            json={"source_code": "print('hello world')", "language_id": 71, "stdin": ""},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "configuration_missing"
        assert "Judge0 API key is not configured" in data["message"]
        assert data["stdout"] is None


def test_execute_code_local_python_success():
    with patch.object(settings, "JUDGE0_API_KEY", ""), patch.object(settings, "ENABLE_LOCAL_CODE_RUNNER", True):
        response = client.post(
            "/api/v1/coding/execute",
            json={
                "source_code": "import sys\nline = sys.stdin.read().strip()\nprint(f'Echo: {line}')",
                "language_id": 71,
                "stdin": "CareerNova Test",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert "Echo: CareerNova Test" in data["stdout"]
        assert data["exit_code"] == 0
        assert data["time_ms"] is not None


def test_execute_code_local_cpp_success():
    with patch.object(settings, "JUDGE0_API_KEY", ""), patch.object(settings, "ENABLE_LOCAL_CODE_RUNNER", True):
        response = client.post(
            "/api/v1/coding/execute",
            json={
                "source_code": "#include <iostream>\nint main() { std::cout << \"CPP Local Verified\" << std::endl; return 0; }",
                "language_id": 54,
                "stdin": "",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert "CPP Local Verified" in data["stdout"]
        assert data["exit_code"] == 0
        assert data["time_ms"] is not None


def test_execute_code_with_mocked_judge0_success():
    mock_judge0_response = {
        "status": {"id": 3, "description": "Accepted"},
        "stdout": "Output: 0 1\n",
        "stderr": None,
        "compile_output": None,
        "time": "0.045",
        "memory": 3520,
        "exit_code": 0,
        "token": "mock-judge0-token-12345",
    }

    mock_resp = httpx.Response(200, json=mock_judge0_response)

    with patch.object(settings, "JUDGE0_API_KEY", "dummy-test-key"):
        with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            response = client.post(
                "/api/v1/coding/execute",
                json={
                    "source_code": "print('0 1')",
                    "language_id": 71,
                    "stdin": "2 7 11 15\n9",
                },
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "completed"
            assert data["judge0_status"] == "Accepted"
            assert data["stdout"] == "Output: 0 1\n"
            assert data["execution_time_seconds"] == 0.045
            assert data["memory_kb"] == 3520
            assert data["exit_code"] == 0


def test_execute_code_with_mocked_judge0_compilation_error():
    mock_judge0_response = {
        "status": {"id": 6, "description": "Compilation Error"},
        "stdout": None,
        "stderr": None,
        "compile_output": "main.cpp:3:1: error: expected ';' before '}' token",
        "time": None,
        "memory": None,
        "exit_code": 1,
    }

    mock_resp = httpx.Response(200, json=mock_judge0_response)

    with patch.object(settings, "JUDGE0_API_KEY", "dummy-test-key"):
        with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            response = client.post(
                "/api/v1/coding/execute",
                json={
                    "source_code": "int main() { return 0 }",
                    "language_id": 54,
                    "stdin": "",
                },
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "compilation_error"
            assert "Compilation Error" in data["judge0_status"]
            assert "error: expected ';'" in data["compile_output"]


def test_evaluate_star_framework_comprehensive():
    payload = {
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
    }

    response = client.post("/api/v1/interview/behavioral/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["completeness_score"] >= 80
    assert data["status"] == "structured"
    assert len(data["components"]) == 4
    assert "disclaimer" in data


def test_evaluate_star_framework_incomplete():
    payload = {
        "question": "Tell me about a failure.",
        "situation": "Server crashed.",
        "task": "Fix it.",
        "action": "We rebooted it.",
        "result": "It worked.",
    }

    response = client.post("/api/v1/interview/behavioral/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["completeness_score"] < 50
    assert data["status"] == "incomplete"
    assert len(data["suggestions"]) > 0


def test_evaluate_architecture_design():
    payload = {
        "problem_id": "url-shortener",
        "requirements_scope": "Design a URL shortener with 100M new URLs monthly, 10:1 read/write ratio, low latency redirect < 20ms.",
        "high_level_design": "Client requests hit Route53 DNS, routed to an API Gateway and Load Balancer, which dispatches to Stateless Application Microservices.",
        "data_modeling": "PostgreSQL database stores short-key, original-url, and user-id with B-tree index on short-key. Redis caching tier stores top 20% hottest URLs.",
        "scalability_tradeoffs": "Horizontal scaling of app tier. DB replication with master-replica failover. Rate limiting on write endpoints using token bucket in Redis to prevent spam.",
    }

    response = client.post("/api/v1/interview/architecture/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["structural_score"] >= 60
    assert "pillars_covered" in data
    assert "pillars_to_expand" in data
    assert "disclaimer" in data


def test_video_audit_session():
    payload = {
        "duration_seconds": 75.5,
        "recorded_format": "video/webm;codecs=vp9",
        "sampled_frames_count": 30,
        "face_detected_ratio": 0.95,
        "transcript_input": "I am a full-stack engineer with expertise in distributed microservices and reactive interfaces.",
    }

    with patch.object(settings, "GEMINI_API_KEY", ""):
        response = client.post("/api/v1/interview/video/audit", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["recording_valid"] is True
        assert data["duration_formatted"] == "01:15"
        assert data["transcription_status"] == "user_provided"
        assert data["ai_feedback_status"] == "unconfigured"
        assert len(data["rubric_guidelines"]) == 3
        assert "technical observations" in data["disclaimer"]


def test_get_coding_topics():
    response = client.get("/api/v1/coding/topics")
    assert response.status_code == 200
    topics = response.json()
    assert isinstance(topics, list)
    assert len(topics) >= 10
    assert "Arrays" in topics
    assert "Strings" in topics
    assert "Basic Programming" in topics


def test_filter_coding_problems_by_category():
    response = client.get("/api/v1/coding/problems?category=Arrays")
    assert response.status_code == 200
    problems = response.json()
    assert len(problems) >= 1
    for p in problems:
        assert p["category"].lower() == "arrays"


def test_filter_coding_problems_by_difficulty():
    response = client.get("/api/v1/coding/problems?difficulty=Easy")
    assert response.status_code == 200
    problems = response.json()
    assert len(problems) >= 3
    for p in problems:
        assert p["difficulty"] == "Easy"


def test_submit_code_solution_accepted():
    # Submit correct solution for fizzbuzz in Python
    code = (
        "import sys\n"
        "raw = sys.stdin.read().strip()\n"
        "if raw:\n"
        "    n = int(raw)\n"
        "    res = []\n"
        "    for i in range(1, n + 1):\n"
        "        if i % 15 == 0: res.append('FizzBuzz')\n"
        "        elif i % 3 == 0: res.append('Fizz')\n"
        "        elif i % 5 == 0: res.append('Buzz')\n"
        "        else: res.append(str(i))\n"
        "    print(' '.join(res))\n"
    )
    response = client.post(
        "/api/v1/coding/submit",
        json={"source_code": code, "language_id": 71, "problem_id": "fizzbuzz"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["passed_count"] == data["total_count"]
    assert data["total_count"] >= 2
    assert "Accepted" in data["message"]


def test_submit_code_solution_wrong_answer():
    # Submit incorrect solution
    code = "print('wrong answer')\n"
    response = client.post(
        "/api/v1/coding/submit",
        json={"source_code": code, "language_id": 71, "problem_id": "fizzbuzz"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "wrong_answer"
    assert data["passed_count"] == 0
    assert len(data["test_results"]) >= 1
    assert data["test_results"][0]["passed"] is False


def test_submit_code_solution_compilation_error():
    # Submit invalid C++ code
    code = "int main() { syntax error }"
    response = client.post(
        "/api/v1/coding/submit",
        json={"source_code": code, "language_id": 54, "problem_id": "fizzbuzz"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "compilation_error"
    assert data["passed_count"] == 0
    assert data["compile_output"] is not None

