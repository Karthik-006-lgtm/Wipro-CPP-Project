import io
import re
from typing import Tuple, List, Optional
from pypdf import PdfReader
from pypdf.errors import PdfReadError
import docx


MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class DocumentExtractionError(Exception):
    """Custom exception raised when document text extraction fails."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def validate_file_size(file_bytes: bytes, max_size: int = MAX_FILE_SIZE_BYTES) -> None:
    """Validates that file content is non-empty and does not exceed maximum limit."""
    if not file_bytes or len(file_bytes) == 0:
        raise DocumentExtractionError("The uploaded file is empty (0 bytes).", status_code=400)
    if len(file_bytes) > max_size:
        raise DocumentExtractionError(
            f"File size ({len(file_bytes)} bytes) exceeds the 10 MB limit.",
            status_code=413,
        )


def normalize_extracted_text(raw_text: str) -> str:
    """
    Normalizes whitespace while preserving line and paragraph structure.
    Removes carriage returns and trailing whitespace per line.
    """
    if not raw_text:
        return ""
    # Standardize newline characters
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    # Clean up non-breaking spaces and tabs
    text = text.replace("\xa0", " ").replace("\t", "    ")
    # Strip trailing whitespace on each line
    lines = [re.sub(r"[ ]+", " ", line).strip() for line in text.split("\n")]
    # Collapse 3 or more consecutive blank lines into 2
    normalized = "\n".join(lines)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, int, List[str]]:
    """
    Extracts text from PDF bytes using pypdf.
    Returns (extracted_text, page_count, warnings).
    """
    # Verify PDF signature (%PDF-)
    if not file_bytes.startswith(b"%PDF-"):
        raise DocumentExtractionError(
            "Invalid file format: Document has a .pdf extension but does not contain a valid PDF signature.",
            status_code=400,
        )

    warnings = []
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except (PdfReadError, Exception) as exc:
        raise DocumentExtractionError(
            f"Unable to read PDF document: File appears corrupted or malformed ({str(exc)}).",
            status_code=422,
        )

    if reader.is_encrypted:
        try:
            # Attempt blank password decrypt
            decrypt_result = reader.decrypt("")
            if decrypt_result == 0:
                raise DocumentExtractionError(
                    "The PDF document is password-protected or encrypted and cannot be processed.",
                    status_code=422,
                )
        except Exception:
            raise DocumentExtractionError(
                "The PDF document is password-protected or encrypted and cannot be processed.",
                status_code=422,
            )

    page_count = len(reader.pages)
    if page_count == 0:
        raise DocumentExtractionError("The PDF document contains 0 pages.", status_code=400)

    extracted_pages = []
    for idx, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_pages.append(page_text.strip())
        except Exception as exc:
            warnings.append(f"Could not extract text from page {idx + 1}: {str(exc)}")

    full_text = "\n\n".join(extracted_pages)
    normalized = normalize_extracted_text(full_text)

    if not normalized:
        raise DocumentExtractionError(
            "No extractable text found in PDF. This document appears to be an image-only scan or contains non-extractable glyphs. Optical Character Recognition (OCR) is not supported in this environment.",
            status_code=422,
        )

    return normalized, page_count, warnings


def extract_text_from_docx(file_bytes: bytes) -> Tuple[str, int, List[str]]:
    """
    Extracts text from Microsoft Word DOCX bytes.
    Returns (extracted_text, paragraph_count, warnings).
    """
    # DOCX is a zip file starting with PK (0x50 0x4B 0x03 0x04)
    if not file_bytes.startswith(b"PK\x03\x04"):
        raise DocumentExtractionError(
            "Invalid file format: Document has a .docx extension but does not contain a valid DOCX container.",
            status_code=400,
        )

    warnings = []
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
    except Exception as exc:
        raise DocumentExtractionError(
            f"Unable to parse Word document: File appears corrupted or malformed ({str(exc)}).",
            status_code=422,
        )

    paragraphs = []
    # Extract body paragraphs
    for p in doc.paragraphs:
        p_text = p.text.strip()
        if p_text:
            paragraphs.append(p_text)

    # Extract tables (common in resumes)
    for table in doc.tables:
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_cells:
                # Remove adjacent duplicates from merged cells
                deduped = []
                for cell_txt in row_cells:
                    if not deduped or deduped[-1] != cell_txt:
                        deduped.append(cell_txt)
                paragraphs.append(" | ".join(deduped))

    full_text = "\n\n".join(paragraphs)
    normalized = normalize_extracted_text(full_text)

    if not normalized:
        raise DocumentExtractionError(
            "No extractable text found in the Word document. The document may be blank or contain only non-text images.",
            status_code=422,
        )

    return normalized, len(paragraphs), warnings


def extract_text_from_txt(file_bytes: bytes) -> Tuple[str, int, List[str]]:
    """
    Extracts text from plain text file bytes using UTF-8, UTF-16, or Latin-1.
    """
    warnings = []
    decoded_text = None

    for encoding in ("utf-8-sig", "utf-8", "utf-16", "cp1252", "latin-1"):
        try:
            decoded_text = file_bytes.decode(encoding)
            break
        except (UnicodeDecodeError, Exception):
            continue

    if decoded_text is None:
        raise DocumentExtractionError(
            "Unable to decode text file: Unsupported character encoding.",
            status_code=422,
        )

    # Reject binary files masquerading as .txt
    control_chars = len([c for c in decoded_text[:1000] if ord(c) < 32 and c not in ("\n", "\r", "\t")])
    if control_chars > 15:
        raise DocumentExtractionError(
            "File contains binary data and is not a valid text document.",
            status_code=400,
        )

    normalized = normalize_extracted_text(decoded_text)
    if not normalized:
        raise DocumentExtractionError(
            "The text file contains no readable content.",
            status_code=400,
        )

    line_count = len(normalized.split("\n"))
    return normalized, line_count, warnings


def extract_document_text(file_bytes: bytes, filename: str) -> Tuple[str, str, int, List[str]]:
    """
    Top-level text extraction dispatcher.
    Returns: (normalized_text, file_format, structural_count, warnings)
    """
    validate_file_size(file_bytes)

    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""

    if ext == ".pdf":
        text, pages, warnings = extract_text_from_pdf(file_bytes)
        return text, "pdf", pages, warnings
    elif ext == ".docx":
        text, elements, warnings = extract_text_from_docx(file_bytes)
        return text, "docx", elements, warnings
    elif ext in (".txt", ".text"):
        text, lines, warnings = extract_text_from_txt(file_bytes)
        return text, "txt", lines, warnings
    else:
        raise DocumentExtractionError(
            f"Unsupported file format '{ext or 'unknown'}'. Please upload a PDF (.pdf), Microsoft Word (.docx), or plain text (.txt) document.",
            status_code=400,
        )
