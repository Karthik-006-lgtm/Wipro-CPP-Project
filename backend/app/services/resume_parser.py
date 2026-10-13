import re
from typing import Dict, Any, List, Optional
from app.services.skill_extractor import extract_skills_from_text


# Regex patterns for contact information
EMAIL_REGEX = r"\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b"
PHONE_REGEX = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}\b"
URL_REGEX = r"(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/(?:in|profile)\/[\w\-_]+|github\.com\/[\w\-_]+|[a-zA-Z0-9-]+\.(?:dev|io|me|portfolio|com))\b"

# Section heading keywords
SECTION_PATTERNS = {
    "Summary / Objective": r"(?:^|\n)\s*(?:professional\s+summary|summary|objective|profile|about\s+me)\b[:\s]*",
    "Experience / Employment": r"(?:^|\n)\s*(?:work\s+experience|professional\s+experience|employment\s+history|experience|career\s+history)\b[:\s]*",
    "Education": r"(?:^|\n)\s*(?:education|academic\s+background|academic\s+history|qualifications)\b[:\s]*",
    "Skills": r"(?:^|\n)\s*(?:technical\s+skills|core\s+skills|key\s+skills|skills\s*&?\s*competencies|skills|technologies)\b[:\s]*",
    "Projects": r"(?:^|\n)\s*(?:technical\s+projects|personal\s+projects|key\s+projects|projects)\b[:\s]*",
    "Certifications": r"(?:^|\n)\s*(?:certifications|licenses\s*&?\s*certifications|professional\s+certifications|certificates)\b[:\s]*",
}

# Known non-name headers and noise words
NON_NAME_WORDS = {
    "resume", "curriculum", "vitae", "cv", "page", "email", "phone", "profile",
    "summary", "experience", "education", "skills", "projects", "contact",
    "developer", "engineer", "designer", "architect", "manager", "lead", "senior",
    "junior", "full stack", "software", "address", "phone", "linkedin", "github"
}

# Education degree keywords
DEGREE_KEYWORDS = [
    r"\b(?:bachelor(?:'s)?|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?e\.?)\b(?:\s+(?:of|in)\s+[\w\s]+)?",
    r"\b(?:master(?:'s)?|m\.?s\.?|m\.?a\.?|m\.?tech|m\.?b\.?a\.?)\b(?:\s+(?:of|in)\s+[\w\s]+)?",
    r"\b(?:ph\.?d\.?|doctorate)\b(?:\s+(?:of|in)\s+[\w\s]+)?",
    r"\b(?:associate(?:'s)?\s+degree|diploma)\b",
]

# Experience date patterns (e.g. 2019 - 2022, Jan 2020 - Present)
DATE_RANGE_REGEX = r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)?\s*(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)?\s*(?:19|20)\d{2})\b"


def extract_candidate_name(lines: List[str]) -> Optional[str]:
    """
    Carefully identifies candidate name from top document lines.
    Applies strict heuristic filters to avoid mistaking headings, job titles, or contact info.
    """
    for line in lines[:6]:
        cleaned = line.strip()
        if not cleaned:
            continue
        # Skip if contains email, phone, or URL symbols
        if "@" in cleaned or "http" in cleaned or "www." in cleaned or "/" in cleaned:
            continue
        if re.search(r"\d", cleaned):
            continue

        # Check word count (names are almost always 2 to 4 words)
        words = cleaned.split()
        if len(words) < 2 or len(words) > 4:
            continue

        # Ensure all words start with uppercase letter and are purely alphabetic
        is_title_cased = all(w[0].isupper() and (w.isalpha() or "-" in w or "." in w) for w in words)
        if not is_title_cased:
            continue

        # Check if line contains non-name buzzwords
        lower_line = cleaned.lower()
        if any(w in lower_line for w in NON_NAME_WORDS):
            continue

        return cleaned

    return None


def extract_contact_info(text: str, lines: List[str]) -> Dict[str, Any]:
    """Extracts email, phone, links, and candidate name."""
    name = extract_candidate_name(lines)

    # Email extraction
    email_match = re.search(EMAIL_REGEX, text)
    email = email_match.group(0).lower() if email_match else None

    # Phone extraction
    phone_match = re.search(PHONE_REGEX, text)
    phone = None
    if phone_match:
        raw_phone = phone_match.group(0).strip()
        # Ensure at least 7 digits to avoid mistaking years/numbers
        if len(re.findall(r"\d", raw_phone)) >= 7:
            phone = raw_phone

    # Links (LinkedIn, GitHub, Portfolio)
    links = [m.group(0) for m in re.finditer(URL_REGEX, text, re.IGNORECASE)]

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "links": list(set(links)),
    }


def detect_sections(text: str) -> List[str]:
    """Identifies standard resume section headings present in the document."""
    detected = []
    for section_name, pattern in SECTION_PATTERNS.items():
        if re.search(pattern, text, re.IGNORECASE):
            detected.append(section_name)
    return detected


def extract_education_entries(text: str) -> List[str]:
    """
    Identifies reliably recognized education degree entries and academic lines.
    """
    entries = []
    lines = text.split("\n")
    
    in_edu_section = False
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue

        # Check for start of Education section
        if re.search(r"^(?:education|academic background|qualifications)\b", cleaned, re.IGNORECASE):
            in_edu_section = True
            continue
        # Check if another major section begins
        if in_edu_section and any(re.search(pat, cleaned, re.IGNORECASE) for pat in SECTION_PATTERNS.values() if "Education" not in pat):
            in_edu_section = False

        # Match degree keywords
        for degree_pat in DEGREE_KEYWORDS:
            if re.search(degree_pat, cleaned, re.IGNORECASE):
                if cleaned not in entries:
                    entries.append(cleaned)
                break
        
        # If inside education section and mentions university/college/institute
        if in_edu_section and re.search(r"\b(?:university|college|institute|polytechnic|school|campus)\b", cleaned, re.IGNORECASE):
            if cleaned not in entries and len(entries) < 5:
                entries.append(cleaned)

    return entries[:6]


def extract_experience_entries(text: str) -> List[str]:
    """
    Identifies work chronology intervals and role headings where reliably recognizable.
    """
    entries = []
    lines = text.split("\n")
    
    for line in lines:
        cleaned = line.strip()
        if not cleaned or len(cleaned) < 8 or len(cleaned) > 140:
            continue

        # Look for lines with employment date ranges (e.g., 2021 - Present)
        if re.search(DATE_RANGE_REGEX, cleaned, re.IGNORECASE):
            if cleaned not in entries:
                entries.append(cleaned)

    return entries[:8]


def extract_certifications(text: str) -> List[str]:
    """
    Identifies certification keywords and accredited credentials.
    """
    cert_patterns = [
        r"\b(?:aws\s+certified\s+[\w\s]+|solutions\s+architect|developer\s+associate)\b",
        r"\b(?:certified\s+kubernetes\s+administrator|cka|ckad)\b",
        r"\b(?:google\s+cloud\s+certified|professional\s+cloud\s+architect)\b",
        r"\b(?:microsoft\s+certified|azure\s+solutions\s+architect)\b",
        r"\b(?:pmp|project\s+management\s+professional)\b",
        r"\b(?:cissp|comptia\s+[\w+]+|hashicorp\s+certified)\b",
    ]
    certs = []
    for pat in cert_patterns:
        matches = re.finditer(pat, text, re.IGNORECASE)
        for m in matches:
            cert_name = m.group(0).strip()
            if cert_name.lower() not in [c.lower() for c in certs]:
                certs.append(cert_name)
    return certs


def parse_resume_content(text: str) -> Dict[str, Any]:
    """
    Orchestrates deterministic parsing of extracted document text.
    Returns typed structured resume dictionary.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    word_count = len(re.findall(r"\b\w+\b", text))
    char_count = len(text)

    # Contact info
    contact_info = extract_contact_info(text, lines)

    # Sections detected
    sections_detected = detect_sections(text)

    # Skills
    detected_skills = extract_skills_from_text(text)

    # Education & Experience
    education = extract_education_entries(text)
    experience = extract_experience_entries(text)
    certifications = extract_certifications(text)

    # Warnings for missing key items
    warnings = []
    if not contact_info["name"]:
        warnings.append("Candidate name could not be confidently identified from top document lines.")
    if not contact_info["email"]:
        warnings.append("No valid email address detected.")
    if not contact_info["phone"]:
        warnings.append("No standard phone number detected.")
    if len(detected_skills) == 0:
        warnings.append("No verified technical skills matched against the controlled taxonomy.")
    if "Experience / Employment" not in sections_detected:
        warnings.append("Standard work experience section heading not explicitly detected.")
    if "Education" not in sections_detected:
        warnings.append("Standard education section heading not explicitly detected.")

    return {
        "contact_info": contact_info,
        "sections_detected": sections_detected,
        "skills": detected_skills,
        "education": education,
        "experience": experience,
        "certifications": certifications,
        "word_count": word_count,
        "char_count": char_count,
        "warnings": warnings,
    }
