from typing import Dict, Any, List


def evaluate_ats_compliance(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates transparent, rule-based ATS checks.
    Does NOT invent a fake proprietary employer score.
    Returns individual check evaluations and an explainable heuristic index.
    """
    checks: List[Dict[str, Any]] = []
    points_earned = 0
    total_possible_points = 60  # 6 checks * 10 points

    # Check 1: Readable Text Extraction
    word_count = parsed_data.get("word_count", 0)
    if word_count >= 150:
        status = "pass"
        points = 10
        explanation = f"Document contains sufficient extractable text ({word_count} words)."
        suggestion = None
        evidence = f"{word_count} words extracted cleanly."
    elif word_count >= 60:
        status = "warning"
        points = 5
        explanation = f"Extracted word count ({word_count} words) is lower than typical resume density."
        suggestion = "Consider expanding on your project descriptions, quantified metrics, and technical contributions."
        evidence = f"{word_count} words extracted."
    else:
        status = "fail"
        points = 0
        explanation = f"Extracted text ({word_count} words) is unusually sparse or may be an image scan."
        suggestion = "Ensure the resume is saved directly from a word processor with extractable text, not scanned as a flat image."
        evidence = f"Only {word_count} words detected."

    points_earned += points
    checks.append({
        "name": "Text Extractability & Volume",
        "status": status,
        "explanation": explanation,
        "evidence": evidence,
        "suggested_improvement": suggestion,
    })

    # Check 2: Contact Information
    contact = parsed_data.get("contact_info", {})
    has_email = bool(contact.get("email"))
    has_phone = bool(contact.get("phone"))
    has_name = bool(contact.get("name"))

    if has_name and has_email and has_phone:
        status = "pass"
        points = 10
        explanation = "Full contact details identified (Name, Email, Phone)."
        suggestion = None
        evidence = f"Name: {contact['name']}, Email: {contact['email']}, Phone: {contact['phone']}"
    elif has_email and (has_name or has_phone):
        status = "warning"
        points = 6
        missing = []
        if not has_name: missing.append("Candidate Name")
        if not has_phone: missing.append("Phone Number")
        explanation = f"Partial contact information detected. Missing: {', '.join(missing)}."
        suggestion = "Ensure your full name appears prominently as the first heading and include a standard phone number."
        evidence = f"Email detected: {contact['email']}."
    else:
        status = "fail"
        points = 0
        explanation = "Essential contact details (Email, Phone) were not found."
        suggestion = "Add your email address and direct contact phone number at the very top of your resume."
        evidence = "No email address or phone number detected in document header."

    points_earned += points
    checks.append({
        "name": "Contact Details Completeness",
        "status": status,
        "explanation": explanation,
        "evidence": evidence,
        "suggested_improvement": suggestion,
    })

    # Check 3: Standard Section Structure
    sections = parsed_data.get("sections_detected", [])
    has_exp = "Experience / Employment" in sections
    has_edu = "Education" in sections
    has_skills = "Skills" in sections

    if has_exp and has_edu and has_skills:
        status = "pass"
        points = 10
        explanation = f"Standard core headings detected ({len(sections)} sections identified: {', '.join(sections)})."
        suggestion = None
        evidence = f"{len(sections)} sections matched."
    elif has_exp or has_edu:
        status = "warning"
        points = 6
        missing = []
        if not has_exp: missing.append("Experience")
        if not has_edu: missing.append("Education")
        if not has_skills: missing.append("Skills")
        explanation = f"Some standard resume headings were not explicitly recognized ({', '.join(missing)})."
        suggestion = f"Use standard industry headings such as 'Work Experience', 'Education', and 'Technical Skills'."
        evidence = f"Sections identified: {', '.join(sections) if sections else 'None'}."
    else:
        status = "fail"
        points = 2
        explanation = "None of the standard resume section headings were recognized."
        suggestion = "Organize resume content under clear, conventional section titles on individual lines."
        evidence = "No standard section patterns matched."

    points_earned += points
    checks.append({
        "name": "Standard Section Headings",
        "status": status,
        "explanation": explanation,
        "evidence": evidence,
        "suggested_improvement": suggestion,
    })

    # Check 4: Identifiable Skills
    skills = parsed_data.get("skills", [])
    skill_count = len(skills)
    if skill_count >= 5:
        status = "pass"
        points = 10
        explanation = f"{skill_count} technical competencies matched against the controlled taxonomy."
        suggestion = None
        evidence = f"Top skills: {', '.join([s['normalized_name'] for s in skills[:5]])}."
    elif skill_count >= 2:
        status = "warning"
        points = 5
        explanation = f"Only {skill_count} technical skills were detected."
        suggestion = "List specific programming languages, frameworks, cloud platforms, and databases in a dedicated Skills section."
        evidence = f"Skills detected: {', '.join([s['normalized_name'] for s in skills])}."
    else:
        status = "fail"
        points = 0
        explanation = "Fewer than 2 technical skills were recognized."
        suggestion = "Include industry-standard technical keywords (e.g., Python, SQL, Docker, React) relevant to your target roles."
        evidence = "No verified skills matched taxonomy."

    points_earned += points
    checks.append({
        "name": "Technical Skill Extraction",
        "status": status,
        "explanation": explanation,
        "evidence": evidence,
        "suggested_improvement": suggestion,
    })

    # Check 5: Experience & Chronology
    experience = parsed_data.get("experience", [])
    if len(experience) >= 2 or (has_exp and len(experience) >= 1):
        status = "pass"
        points = 10
        explanation = "Employment dates and chronological work history intervals were identified."
        suggestion = None
        evidence = f"{len(experience)} work history markers detected."
    elif len(experience) == 1:
        status = "warning"
        points = 5
        explanation = "Only one chronological work entry was identified."
        suggestion = "Ensure date ranges follow standard formats like 'MM/YYYY - MM/YYYY' or 'Month YYYY - Present'."
        evidence = "1 work chronology interval detected."
    else:
        status = "warning"
        points = 3
        explanation = "No explicit date-formatted employment intervals recognized."
        suggestion = "Include explicit date ranges (e.g. '2021 – 2024') for each professional position."
        evidence = "No employment date intervals matched."

    points_earned += points
    checks.append({
        "name": "Work History Chronology",
        "status": status,
        "explanation": explanation,
        "evidence": evidence,
        "suggested_improvement": suggestion,
    })

    # Check 6: Document Word Density (Optimal Range: 250 - 1000 words)
    if 250 <= word_count <= 1100:
        status = "pass"
        points = 10
        explanation = f"Document length ({word_count} words) is optimal for standard 1 to 2-page ATS scanning."
        suggestion = None
        evidence = f"{word_count} words (ideal range: 250-1100 words)."
    elif 100 <= word_count < 250:
        status = "warning"
        points = 6
        explanation = f"Resume is relatively brief ({word_count} words)."
        suggestion = "Add more detail regarding project impact, architectural decisions, and responsibilities."
        evidence = f"{word_count} words."
    elif word_count > 1100:
        status = "warning"
        points = 6
        explanation = f"Resume length ({word_count} words) is verbose."
        suggestion = "Consider consolidating older experience and trimming bullet points to focus on recent high-impact roles."
        evidence = f"{word_count} words."
    else:
        status = "fail"
        points = 2
        explanation = "Document word count falls outside recommended parameters."
        suggestion = "Ensure resume is at least 250 words with comprehensive career history."
        evidence = f"{word_count} words."

    points_earned += points
    checks.append({
        "name": "Document Length & Density",
        "status": status,
        "explanation": explanation,
        "evidence": evidence,
        "suggested_improvement": suggestion,
    })

    # Calculate overall transparent heuristic index (scaled to 100)
    heuristic_score = round((points_earned / total_possible_points) * 100)

    return {
        "heuristic_score": heuristic_score,
        "score_disclaimer": "Internal rule-based readiness heuristic based on structural ATS readability; not a proprietary employer ATS score.",
        "checks": checks,
    }
