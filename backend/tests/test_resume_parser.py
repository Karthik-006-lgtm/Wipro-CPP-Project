import io
import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter
import docx

from app.main import app
from app.services.extractor import (
    extract_document_text,
    DocumentExtractionError,
    validate_file_size,
    normalize_extracted_text,
    MAX_FILE_SIZE_BYTES,
)
from app.services.skill_extractor import extract_skills_from_text
from app.services.resume_parser import parse_resume_content
from app.services.ats_checker import evaluate_ats_compliance

client = TestClient(app)


# Sample fictional resume text
SAMPLE_RESUME_TEXT = """
Jane Doe
jane.doe@example.com | (555) 123-4567 | github.com/janedoe | linkedin.com/in/janedoe

PROFESSIONAL SUMMARY
Experienced Full-Stack Engineer with 5+ years of experience designing high-throughput distributed systems and RESTful APIs using Python, FastAPI, and React.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL, HTML, CSS
Frameworks: FastAPI, React, Node.js, Next.js, Django
Databases: PostgreSQL, Redis, MongoDB
DevOps & Cloud: AWS, Docker, Kubernetes, Linux, CI/CD, Git
Core Concepts: REST APIs, System Design, Microservices, Data Structures & Algorithms, Unit Testing

WORK EXPERIENCE
Senior Software Engineer | CloudScale Inc.
Jan 2022 - Present
- Architected asynchronous event-driven microservices with FastAPI and PostgreSQL handling 10k requests/min.
- Optimized Redis caching layer, decreasing p99 latency by 45%.
- Containerized development workflows using Docker and Kubernetes on AWS.

Software Engineer | FinTech Systems
June 2019 - Dec 2021
- Developed interactive web dashboards using React, TypeScript, and Tailwind CSS.
- Automated CI/CD deployment pipelines using GitHub Actions.

EDUCATION
Bachelor of Science in Computer Science
State University of Technology | 2015 - 2019

CERTIFICATIONS
AWS Certified Solutions Architect Associate
"""


def create_in_memory_pdf(text: str) -> bytes:
    """Creates a valid PDF binary in memory with extractable text."""
    # Using pypdf to create a blank PDF with page containing TextAnnotation/FreeText or content stream
    # Note: ReportLab or simple PDF stream format
    # In pure Python without reportlab, we can write a valid PDF text stream
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length 200 >>\nstream\n"
        b"BT /F1 12 Tf 72 712 Td (Jane Doe) Tj ET\n"
        b"BT /F1 10 Tf 72 690 Td (jane.doe@example.com) Tj ET\n"
        b"BT /F1 10 Tf 72 670 Td (Python FastAPI React PostgreSQL Docker AWS) Tj ET\n"
        b"BT /F1 10 Tf 72 650 Td (Work Experience: Senior Software Engineer 2022 - Present) Tj ET\n"
        b"BT /F1 10 Tf 72 630 Td (Education: Bachelor of Science in Computer Science) Tj ET\n"
        b"endstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000234 00000 n \n0000000486 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n555\n%%EOF\n"
    )
    return pdf_content


def create_in_memory_docx(text: str) -> bytes:
    """Creates a valid DOCX document binary in memory."""
    doc = docx.Document()
    for paragraph in text.split("\n\n"):
        if paragraph.strip():
            doc.add_paragraph(paragraph.strip())
    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


# -------------------------------------------------------------------------
# Test Text Extraction Service
# -------------------------------------------------------------------------

def test_extract_txt_resume():
    raw_bytes = SAMPLE_RESUME_TEXT.encode("utf-8")
    text, fmt, count, warnings = extract_document_text(raw_bytes, "resume.txt")
    assert fmt == "txt"
    assert "Jane Doe" in text
    assert "FastAPI" in text
    assert count > 10


def test_extract_docx_resume():
    docx_bytes = create_in_memory_docx(SAMPLE_RESUME_TEXT)
    text, fmt, count, warnings = extract_document_text(docx_bytes, "candidate.docx")
    assert fmt == "docx"
    assert "Jane Doe" in text
    assert "FastAPI" in text
    assert count > 0


def test_extract_pdf_resume():
    pdf_bytes = create_in_memory_pdf(SAMPLE_RESUME_TEXT)
    text, fmt, pages, warnings = extract_document_text(pdf_bytes, "candidate.pdf")
    assert fmt == "pdf"
    assert "Jane Doe" in text
    assert "FastAPI" in text
    assert pages >= 1


def test_reject_empty_file():
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_document_text(b"", "empty.txt")
    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.message.lower()


def test_reject_unsupported_format():
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_document_text(b"some binary data", "image.png")
    assert exc_info.value.status_code == 400
    assert "unsupported" in exc_info.value.message.lower()


def test_reject_oversized_file():
    oversized = b"A" * (MAX_FILE_SIZE_BYTES + 1024)
    with pytest.raises(DocumentExtractionError) as exc_info:
        validate_file_size(oversized)
    assert exc_info.value.status_code == 413


def test_reject_corrupted_pdf():
    # File with .pdf extension but invalid header
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_document_text(b"This is not a pdf header", "corrupt.pdf")
    assert exc_info.value.status_code == 400


def test_reject_corrupted_docx():
    # File with .docx extension but invalid zip container
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_document_text(b"Not a zip file", "corrupt.docx")
    assert exc_info.value.status_code == 400


# -------------------------------------------------------------------------
# Test Skill Extraction & Normalization
# -------------------------------------------------------------------------

def test_skill_extraction_and_normalization():
    text = "We built applications using postgres, React.js, and Golang alongside Docker and k8s."
    skills = extract_skills_from_text(text)
    skill_names = [s["normalized_name"] for s in skills]

    assert "PostgreSQL" in skill_names
    assert "React" in skill_names
    assert "Go" in skill_names
    assert "Docker" in skill_names
    assert "Kubernetes" in skill_names

    # Check that postgres mapped to normalized PostgreSQL
    pg_skill = next(s for s in skills if s["normalized_name"] == "PostgreSQL")
    assert pg_skill["raw_term"].lower() == "postgres"
    assert "postgres" in pg_skill["evidence"].lower()


def test_skill_deduplication():
    # Multiple mentions of Python and Django
    text = "Python developer with Python 3 experience writing python code in Django and django."
    skills = extract_skills_from_text(text)
    normalized_skills = [s["normalized_name"] for s in skills]

    assert normalized_skills.count("Python") == 1
    assert normalized_skills.count("Django") == 1


# -------------------------------------------------------------------------
# Test Structured Parsing & ATS Checks
# -------------------------------------------------------------------------

def test_resume_parser_structured_output():
    parsed = parse_resume_content(SAMPLE_RESUME_TEXT)

    assert parsed["contact_info"]["name"] == "Jane Doe"
    assert parsed["contact_info"]["email"] == "jane.doe@example.com"
    assert parsed["contact_info"]["phone"] == "(555) 123-4567"
    assert len(parsed["skills"]) >= 10
    assert "Experience / Employment" in parsed["sections_detected"]
    assert "Education" in parsed["sections_detected"]
    assert "Skills" in parsed["sections_detected"]
    assert len(parsed["education"]) >= 1
    assert len(parsed["experience"]) >= 1
    assert len(parsed["certifications"]) >= 1


def test_resume_parser_missing_contact_info():
    sparse_text = "Experienced worker with no header. Just some text about projects and systems."
    parsed = parse_resume_content(sparse_text)

    assert parsed["contact_info"]["name"] is None
    assert parsed["contact_info"]["email"] is None
    assert parsed["contact_info"]["phone"] is None
    assert any("email" in w.lower() for w in parsed["warnings"])


def test_ats_checker_evaluation():
    parsed = parse_resume_content(SAMPLE_RESUME_TEXT)
    ats_result = evaluate_ats_compliance(parsed)

    assert ats_result["heuristic_score"] >= 80
    assert len(ats_result["checks"]) == 6
    for check in ats_result["checks"]:
        assert check["status"] in ("pass", "warning", "fail")
        assert "suggested_improvement" in check


# -------------------------------------------------------------------------
# Test API Endpoint (POST /api/v1/resumes/parse)
# -------------------------------------------------------------------------

def test_api_parse_resume_txt_success():
    response = client.post(
        "/api/v1/resumes/parse",
        files={"file": ("jane_doe_resume.txt", SAMPLE_RESUME_TEXT.encode("utf-8"), "text/plain")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["metadata"]["filename"] == "jane_doe_resume.txt"
    assert data["metadata"]["file_format"] == "txt"
    assert data["contact_info"]["name"] == "Jane Doe"
    assert data["contact_info"]["email"] == "jane.doe@example.com"
    assert len(data["skills"]) >= 10
    assert data["ats_evaluation"]["heuristic_score"] >= 75


def test_api_parse_resume_docx_success():
    docx_bytes = create_in_memory_docx(SAMPLE_RESUME_TEXT)
    response = client.post(
        "/api/v1/resumes/parse",
        files={"file": ("jane_doe_resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["metadata"]["file_format"] == "docx"
    assert data["contact_info"]["email"] == "jane.doe@example.com"


def test_api_parse_resume_unsupported_format():
    response = client.post(
        "/api/v1/resumes/parse",
        files={"file": ("photo.jpg", b"fake jpg content", "image/jpeg")},
    )
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()


def test_api_parse_resume_empty_file():
    response = client.post(
        "/api/v1/resumes/parse",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()
