import io
import docx
import pypdf
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.resume_generator.utils import sanitize_resume_filename


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_resume_payload():
    return {
        "template_id": "classic_professional",
        "personal_info": {
            "full_name": "Jordan Hayes",
            "email": "jordan.hayes@example.com",
            "phone": "+1 (555) 234-5678",
            "location": "San Francisco, CA",
            "title": "Principal Distributed Systems Engineer",
            "linkedin": "linkedin.com/in/jordanhayes",
            "github": "github.com/jordanhayes",
            "portfolio": "https://jordanhayes.dev",
        },
        "summary": "Results-driven principal software engineer with 8+ years designing high-throughput event streaming architectures, resilient microservices, and reactive web applications using FastAPI, Python, and React.",
        "skill_groups": [
            {
                "category": "Languages",
                "skills": ["Python", "TypeScript", "Go", "C++", "SQL"],
            },
            {
                "category": "Frameworks & Tools",
                "skills": ["FastAPI", "React", "Docker", "Kubernetes", "PostgreSQL", "Kafka"],
            },
        ],
        "experience": [
            {
                "organization": "Nexus Cloud Technologies",
                "role": "Lead Infrastructure Architect",
                "location": "San Francisco, CA",
                "start_date": "Jan 2021",
                "end_date": "Present",
                "current": True,
                "responsibilities": [
                    "Architected globally distributed multi-region message router serving 1.2 billion events per day.",
                    "Reduced p99 tail latency from 85ms to 18ms by migrating caching tiers to Redis Cluster.",
                    "Mentored team of 8 backend engineers and instituted automated chaos testing in CI/CD pipelines.",
                ],
            },
            {
                "organization": "Acuity Data Systems",
                "role": "Senior Backend Engineer",
                "location": "Austin, TX",
                "start_date": "Mar 2018",
                "end_date": "Dec 2020",
                "current": False,
                "responsibilities": [
                    "Engineered asynchronous ETL pipelines processing 15TB daily customer transaction data.",
                    "Implemented zero-downtime database schema migrations for PostgreSQL clusters.",
                ],
            },
        ],
        "projects": [
            {
                "title": "AetherFlow Streaming Engine",
                "description": "High-throughput asynchronous event distribution broker with guaranteed exactly-once delivery.",
                "technologies": ["Python", "FastAPI", "Kafka", "Redis"],
                "contributions": [
                    "Engineered custom backpressure algorithm preventing memory exhaustion during traffic spikes.",
                    "Authored automated integration test suite validating partition rebalancing.",
                ],
                "link": "https://github.com/jordanhayes/aetherflow",
            }
        ],
        "education": [
            {
                "institution": "University of California, Berkeley",
                "degree": "B.S. in Electrical Engineering & Computer Science",
                "start_date": "Aug 2014",
                "end_date": "May 2018",
                "gpa_or_honors": "3.85 / 4.00 (Magna Cum Laude)",
                "details": "Specialization in Distributed Systems and Algorithms.",
            }
        ],
        "certifications": [
            {
                "name": "AWS Certified Solutions Architect — Professional",
                "issuer": "Amazon Web Services",
                "date": "2023",
                "credential_url_or_id": "AWS-PSA-98214",
            }
        ],
        "custom_sections": [
            {
                "title": "Patents & Publications",
                "items": [
                    "US Patent 11,204,891: Dynamic Buffer Allocation in Stream Routing Networks.",
                ],
            }
        ],
    }


# =====================================================================
# 1. FILENAME SANITIZATION TESTS
# =====================================================================

def test_sanitize_resume_filename():
    assert sanitize_resume_filename("Jordan Hayes", "classic_professional", "pdf") == "Jordan_Hayes_Resume_Classic.pdf"
    assert sanitize_resume_filename("Alice B. Cooper!", "modern_technical", "docx") == "Alice_B_Cooper_Resume_Modern.docx"
    assert sanitize_resume_filename("   ", "custom", "pdf") == "Candidate_Resume_ATS.pdf"
    assert sanitize_resume_filename("Jean-Luc Picard", "modern_technical", "pdf") == "Jean-Luc_Picard_Resume_Modern.pdf"


# =====================================================================
# 2. VALIDATION & PREVIEW TESTS
# =====================================================================

def test_resume_preview_endpoint(client, sample_resume_payload):
    response = client.post("/api/v1/resumes/preview", json=sample_resume_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["candidate_name"] == "Jordan Hayes"
    assert data["target_role"] == "Principal Distributed Systems Engineer"
    assert data["section_counts"]["experience_entries"] == 2
    assert data["section_counts"]["project_entries"] == 1
    assert data["section_counts"]["education_entries"] == 1
    assert data["section_counts"]["certifications_entries"] == 1


def test_resume_preview_with_empty_optional_sections(client):
    payload = {
        "template_id": "classic_professional",
        "personal_info": {
            "full_name": "Minimalist Candidate",
            "email": "minimal@example.com",
        },
        "summary": "",
        "skill_groups": [],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "custom_sections": [],
    }
    response = client.post("/api/v1/resumes/preview", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert len(data["validation_warnings"]) >= 3  # Warns about empty summary/skills/experience


def test_resume_generation_rejects_missing_required_fields(client):
    # Missing full_name
    bad_payload = {
        "template_id": "classic_professional",
        "personal_info": {
            "full_name": "   ",
            "email": "test@example.com",
        },
    }
    response_pdf = client.post("/api/v1/resumes/generate/pdf", json=bad_payload)
    assert response_pdf.status_code == 422

    response_docx = client.post("/api/v1/resumes/generate/docx", json=bad_payload)
    assert response_docx.status_code == 422


# =====================================================================
# 3. PDF GENERATION & CONTENT VALIDATION TESTS
# =====================================================================

def test_generate_pdf_classic_template(client, sample_resume_payload):
    sample_resume_payload["template_id"] = "classic_professional"
    response = client.post("/api/v1/resumes/generate/pdf", json=sample_resume_payload)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'attachment; filename="Jordan_Hayes_Resume_Classic.pdf"' in response.headers["content-disposition"]
    
    # Verify binary PDF header
    content = response.content
    assert content.startswith(b"%PDF-")
    assert len(content) > 1000

    # Structural PDF inspection using pypdf
    reader = pypdf.PdfReader(io.BytesIO(content))
    assert len(reader.pages) >= 1
    full_pdf_text = "".join(page.extract_text() for page in reader.pages)
    
    # Assert actual user content is present in the extracted PDF text
    assert "Jordan Hayes" in full_pdf_text
    assert "Nexus Cloud Technologies" in full_pdf_text
    assert "AetherFlow Streaming Engine" in full_pdf_text
    assert "University of California" in full_pdf_text
    assert "Berkeley" in full_pdf_text
    assert "AWS Certified Solutions Architect" in full_pdf_text


def test_generate_pdf_modern_technical_template(client, sample_resume_payload):
    sample_resume_payload["template_id"] = "modern_technical"
    response = client.post("/api/v1/resumes/generate/pdf", json=sample_resume_payload)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'attachment; filename="Jordan_Hayes_Resume_Modern.pdf"' in response.headers["content-disposition"]

    content = response.content
    assert content.startswith(b"%PDF-")
    reader = pypdf.PdfReader(io.BytesIO(content))
    assert len(reader.pages) >= 1
    full_pdf_text = "".join(page.extract_text() for page in reader.pages)
    assert "Jordan Hayes" in full_pdf_text
    assert "Nexus Cloud Technologies" in full_pdf_text


# =====================================================================
# 4. DOCX GENERATION & CONTENT VALIDATION TESTS
# =====================================================================

def test_generate_docx_classic_template(client, sample_resume_payload):
    sample_resume_payload["template_id"] = "classic_professional"
    response = client.post("/api/v1/resumes/generate/docx", json=sample_resume_payload)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert 'attachment; filename="Jordan_Hayes_Resume_Classic.docx"' in response.headers["content-disposition"]

    # Open with python-docx to verify actual document structure
    docx_file = docx.Document(io.BytesIO(response.content))
    full_docx_text = "\n".join(p.text for p in docx_file.paragraphs)
    
    assert "Jordan Hayes" in full_docx_text
    assert "Principal Distributed Systems Engineer" in full_docx_text
    assert "Nexus Cloud Technologies" in full_docx_text
    assert "AetherFlow Streaming Engine" in full_docx_text
    assert "Berkeley" in full_docx_text
    assert "AWS-PSA-98214" in full_docx_text


def test_generate_docx_modern_technical_template(client, sample_resume_payload):
    sample_resume_payload["template_id"] = "modern_technical"
    response = client.post("/api/v1/resumes/generate/docx", json=sample_resume_payload)
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert 'attachment; filename="Jordan_Hayes_Resume_Modern.docx"' in response.headers["content-disposition"]

    docx_file = docx.Document(io.BytesIO(response.content))
    full_docx_text = "\n".join(p.text for p in docx_file.paragraphs)
    assert "Jordan Hayes" in full_docx_text
    assert "Nexus Cloud Technologies" in full_docx_text


# =====================================================================
# 5. MULTI-PAGE & LONG CONTENT STRESS TEST
# =====================================================================

def test_generate_multipage_resume(client, sample_resume_payload):
    # Expand experience and projects with extensive content to trigger multi-page layout
    extra_experience = []
    for i in range(1, 8):
        extra_experience.append({
            "organization": f"Enterprise Software Inc. #{i}",
            "role": f"Staff Architect #{i}",
            "location": "Remote",
            "start_date": f"201{i}",
            "end_date": f"201{i+1}",
            "current": False,
            "responsibilities": [
                f"Led engineering initiatives for product division #{i} supporting millions of concurrent transactions.",
                f"Managed deployment infrastructure across Kubernetes clusters and ensured 99.99% availability.",
                f"Designed distributed caching protocols and coordinated cross-functional architecture reviews.",
            ],
        })
    sample_resume_payload["experience"].extend(extra_experience)

    # Test PDF generation handles multi-page cleanly
    resp_pdf = client.post("/api/v1/resumes/generate/pdf", json=sample_resume_payload)
    assert resp_pdf.status_code == 200
    reader = pypdf.PdfReader(io.BytesIO(resp_pdf.content))
    assert len(reader.pages) > 1  # Successfully spans across multiple pages

    # Test DOCX generation handles extensive content
    resp_docx = client.post("/api/v1/resumes/generate/docx", json=sample_resume_payload)
    assert resp_docx.status_code == 200
    docx_file = docx.Document(io.BytesIO(resp_docx.content))
    assert len(docx_file.paragraphs) > 20
