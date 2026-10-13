from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Response, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserActivity
from app.api.deps import get_current_user_optional
from app.services.extractor import extract_document_text, DocumentExtractionError, MAX_FILE_SIZE_BYTES
from app.services.resume_parser import parse_resume_content
from app.services.ats_checker import evaluate_ats_compliance
from app.schemas.resume import (
    ResumeParseResponse,
    ResumeMetadata,
    ContactInfo,
    DetectedSkill,
    AtsEvaluation,
    AtsCheck,
)
from app.schemas.resume_generator import (
    ResumeGeneratorRequest,
    ResumePreviewResponse,
)
from app.services.resume_generator import (
    build_resume_pdf,
    build_resume_docx,
    sanitize_resume_filename,
)

router = APIRouter()


@router.post(
    "/parse",
    response_model=ResumeParseResponse,
    status_code=status.HTTP_200_OK,
    summary="Parse candidate resume and extract structured competencies and ATS checks",
)
async def parse_resume(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> ResumeParseResponse:
    """
    Receives an uploaded resume document (.pdf, .docx, .txt), extracts normalized text,
    identifies structured profile sections and technical skills, and computes transparent ATS checks.
    """
    # Validate filename existence
    filename = file.filename or "uploaded_document"

    # Read file content safely in memory
    try:
        content = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(exc)}",
        )

    # Validate file size
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed limit of 10 MB (received {len(content)} bytes).",
        )

    # Extract text using document extractor service
    try:
        extracted_text, file_format, structural_count, extraction_warnings = extract_document_text(
            file_bytes=content,
            filename=filename,
        )
    except DocumentExtractionError as err:
        raise HTTPException(
            status_code=err.status_code,
            detail=err.message,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the document.",
        )

    # Parse structured content
    try:
        parsed_data = parse_resume_content(extracted_text)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while analyzing the extracted resume text.",
        )

    # Evaluate transparent ATS checks
    try:
        ats_data = evaluate_ats_compliance(parsed_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while computing ATS compliance metrics.",
        )

    # Combine warnings
    all_warnings = extraction_warnings + parsed_data.get("warnings", [])

    # Format response preview (first 1000 characters)
    preview = extracted_text[:1000]
    if len(extracted_text) > 1000:
        preview += "..."

    # Record activity if authenticated
    if current_user:
        try:
            act = UserActivity(
                user_id=current_user.id,
                activity_type="resume_parse",
                title=f"Parsed Resume: {filename}",
                status="completed",
                metadata_json={
                    "filename": filename,
                    "format": file_format,
                    "skills_count": len(parsed_data["skills"]),
                    "score": ats_data["heuristic_score"],
                },
            )
            db.add(act)
            db.commit()
        except Exception:
            db.rollback()

    # Build typed response model
    return ResumeParseResponse(
        success=True,
        metadata=ResumeMetadata(
            filename=filename,
            file_format=file_format,
            file_size_bytes=len(content),
            word_count=parsed_data["word_count"],
            char_count=parsed_data["char_count"],
            structural_units=structural_count,
        ),
        contact_info=ContactInfo(**parsed_data["contact_info"]),
        sections_detected=parsed_data["sections_detected"],
        skills=[DetectedSkill(**s) for s in parsed_data["skills"]],
        education=parsed_data["education"],
        experience=parsed_data["experience"],
        certifications=parsed_data["certifications"],
        ats_evaluation=AtsEvaluation(
            heuristic_score=ats_data["heuristic_score"],
            score_disclaimer=ats_data["score_disclaimer"],
            checks=[AtsCheck(**c) for c in ats_data["checks"]],
        ),
        extracted_text_preview=preview,
        warnings=all_warnings,
    )


@router.post(
    "/generate/pdf",
    summary="Generate professional PDF resume from structured profile",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Returns compiled binary PDF file",
        }
    },
)
async def generate_resume_pdf(
    request: ResumeGeneratorRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Validates resume input, renders selected layout template (Classic Professional or Modern Technical),
    and returns a downloadable PDF stream with sanitized Content-Disposition filename.
    """
    if not request.personal_info.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name is required to generate a resume.",
        )
    if not request.personal_info.email.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email address is required to generate a resume.",
        )

    try:
        pdf_bytes = build_resume_pdf(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF document: {str(exc)}",
        )

    filename = sanitize_resume_filename(
        candidate_name=request.personal_info.full_name,
        template_id=request.template_id,
        extension="pdf",
    )

    if current_user:
        try:
            act = UserActivity(
                user_id=current_user.id,
                activity_type="resume_generate",
                title=f"Generated PDF Resume: {request.personal_info.full_name}",
                status="completed",
                metadata_json={"template_id": request.template_id, "format": "pdf"},
            )
            db.add(act)
            db.commit()
        except Exception:
            db.rollback()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.post(
    "/generate/docx",
    summary="Generate Microsoft Word compatible DOCX resume from structured profile",
    response_class=Response,
    responses={
        200: {
            "content": {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}
            },
            "description": "Returns compiled binary DOCX file",
        }
    },
)
async def generate_resume_docx(
    request: ResumeGeneratorRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Validates resume input, builds styled Microsoft Word document preserving layout,
    and returns a downloadable DOCX stream with sanitized Content-Disposition filename.
    """
    if not request.personal_info.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name is required to generate a resume.",
        )
    if not request.personal_info.email.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email address is required to generate a resume.",
        )

    try:
        docx_bytes = build_resume_docx(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate DOCX document: {str(exc)}",
        )

    filename = sanitize_resume_filename(
        candidate_name=request.personal_info.full_name,
        template_id=request.template_id,
        extension="docx",
    )

    if current_user:
        try:
            act = UserActivity(
                user_id=current_user.id,
                activity_type="resume_generate",
                title=f"Generated DOCX Resume: {request.personal_info.full_name}",
                status="completed",
                metadata_json={"template_id": request.template_id, "format": "docx"},
            )
            db.add(act)
            db.commit()
        except Exception:
            db.rollback()

    return Response(

        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.post(
    "/preview",
    response_model=ResumePreviewResponse,
    summary="Validate resume payload and compute section breakdown preview",
)
async def preview_resume(request: ResumeGeneratorRequest) -> ResumePreviewResponse:
    """
    Validates structured resume inputs and returns summary counts without generating binary files.
    """
    warnings = []
    if not request.summary or not request.summary.strip():
        warnings.append("Professional summary is empty; adding an overview helps ATS indexing.")
    if not request.skill_groups:
        warnings.append("No technical skills provided; skills are strongly recommended for ATS matching.")
    if not request.experience:
        warnings.append("No work experience entries provided.")
    if not request.education:
        warnings.append("No education entries provided.")

    section_counts = {
        "skill_groups": len(request.skill_groups),
        "total_skills": sum(len(sg.skills) for sg in request.skill_groups),
        "experience_entries": len(request.experience),
        "project_entries": len(request.projects),
        "education_entries": len(request.education),
        "certifications_entries": len(request.certifications),
        "custom_sections": len(request.custom_sections),
    }

    return ResumePreviewResponse(
        valid=True,
        template_id=request.template_id,
        candidate_name=request.personal_info.full_name,
        target_role=request.personal_info.title,
        section_counts=section_counts,
        validation_warnings=warnings,
    )
