import re
import html


def sanitize_resume_filename(candidate_name: str, template_id: str, extension: str) -> str:
    """
    Creates a safe, clean filename for download headers.
    E.g., "Alex Rivera" -> "Alex_Rivera_Resume_Classic.pdf"
    """
    cleaned = re.sub(r'[^a-zA-Z0-9_\- ]', '', candidate_name).strip()
    if not cleaned:
        cleaned = "Candidate"
    cleaned = re.sub(r'\s+', '_', cleaned)

    tpl_key = template_id.lower()
    if "modern" in tpl_key:
        suffix = "Modern"
    elif "classic" in tpl_key:
        suffix = "Classic"
    else:
        suffix = "ATS"

    ext = extension.lstrip(".")
    return f"{cleaned}_Resume_{suffix}.{ext}"


def escape_reportlab_text(text: str) -> str:
    """
    Escapes XML special characters for ReportLab Paragraph markup.
    """
    if not text:
        return ""
    # Use standard html escaping to prevent XML parsing exceptions in ReportLab
    return html.escape(text, quote=False)
