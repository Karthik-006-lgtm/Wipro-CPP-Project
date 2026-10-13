import re
from typing import List, Dict, Any
from app.core.config import settings
from app.schemas.interview import (
    StarEvaluationRequest,
    StarEvaluationResponse,
    StarComponentCheck,
    ArchitectureEvaluationRequest,
    ArchitectureEvaluationResponse,
    VideoAuditRequest,
    VideoAuditResponse,
)


def evaluate_star_framework(req: StarEvaluationRequest) -> StarEvaluationResponse:
    """
    Evaluates the structural completeness of a candidate's STAR answer.
    Provides transparent, rule-based feedback on structure without personality profiling.
    """
    components: List[StarComponentCheck] = []
    suggestions: List[str] = []
    total_score = 0

    # 1. Situation Analysis
    sit_words = len(req.situation.strip().split())
    if sit_words >= 25:
        sit_status = "pass"
        sit_feedback = f"Strong context setting ({sit_words} words). Sufficient background provided."
        total_score += 25
    elif sit_words >= 10:
        sit_status = "warning"
        sit_feedback = f"Brief context ({sit_words} words). Consider adding specific organizational and technical background."
        total_score += 15
        suggestions.append("Expand the Situation section with specific team size, company stage, or architectural context.")
    else:
        sit_status = "needs_expansion"
        sit_feedback = f"Context is too brief ({sit_words} words) to understand the operating environment."
        total_score += 5
        suggestions.append("Provide a clear description of the project or team situation where this occurred.")
    components.append(StarComponentCheck(component="Situation", word_count=sit_words, status=sit_status, feedback=sit_feedback))

    # 2. Task Analysis
    task_words = len(req.task.strip().split())
    if task_words >= 20:
        task_status = "pass"
        task_feedback = f"Clear problem framing ({task_words} words). The objective and obstacles are articulated."
        total_score += 25
    elif task_words >= 8:
        task_status = "warning"
        task_feedback = f"Objective stated briefly ({task_words} words). Explicitly define your individual responsibility."
        total_score += 15
        suggestions.append("Clarify the difference between the team's objective and your individual assigned task.")
    else:
        task_status = "needs_expansion"
        task_feedback = f"Task statement is minimal ({task_words} words). What was the core obstacle or deliverable?"
        total_score += 5
        suggestions.append("Clearly state the specific challenge or goal you were responsible for overcoming.")
    components.append(StarComponentCheck(component="Task", word_count=task_words, status=task_status, feedback=task_feedback))

    # 3. Action Analysis (Heaviest weight - demonstrates candidate contribution)
    act_words = len(req.action.strip().split())
    has_first_person = bool(re.search(r"\b(i|my|mine|me)\b", req.action, re.IGNORECASE))
    if act_words >= 45 and has_first_person:
        act_status = "pass"
        act_feedback = f"Detailed technical action plan ({act_words} words) highlighting individual ownership."
        total_score += 30
    elif act_words >= 20:
        act_status = "warning"
        act_feedback = f"Action is moderately detailed ({act_words} words). Ensure you highlight 'I did' rather than only 'We did'."
        total_score += 18
        suggestions.append("Detail the exact technical trade-offs, algorithms, or communication steps you personally drove.")
    else:
        act_status = "needs_expansion"
        act_feedback = f"Action step is underdeveloped ({act_words} words). This is the most crucial part of an interview."
        total_score += 8
        suggestions.append("Significantly expand the Action section with technical implementation steps and personal ownership.")
    components.append(StarComponentCheck(component="Action", word_count=act_words, status=act_status, feedback=act_feedback))

    # 4. Result Analysis (Checks for quantifiable outcomes)
    res_words = len(req.result.strip().split())
    has_metrics = bool(re.search(r"(\d+%|\$\d+|\d+\s*(ms|sec|hours|days|x|percent|users))", req.result, re.IGNORECASE))
    if res_words >= 25 and has_metrics:
        res_status = "pass"
        res_feedback = f"Impactful result ({res_words} words) with quantifiable metrics and outcome verification."
        total_score += 20
    elif res_words >= 15:
        res_status = "warning"
        res_feedback = f"Outcome described ({res_words} words), but lacks specific quantitative metrics."
        total_score += 12
        suggestions.append("Add quantifiable metrics to the Result (e.g. latency reduction %, cost saved, or delivery timeline).")
    else:
        res_status = "needs_expansion"
        res_feedback = f"Result is brief or vague ({res_words} words). What was the long-term impact on the team or product?"
        total_score += 5
        suggestions.append("State the measurable business or engineering impact of your action.")
    components.append(StarComponentCheck(component="Result", word_count=res_words, status=res_status, feedback=res_feedback))

    if total_score >= 80:
        overall_status = "structured"
    elif total_score >= 50:
        overall_status = "needs_expansion"
    else:
        overall_status = "incomplete"

    return StarEvaluationResponse(
        completeness_score=total_score,
        status=overall_status,
        components=components,
        suggestions=suggestions,
        disclaimer="This evaluation measures structural completeness of the STAR framework. It does not judge candidate honesty, personality, or employability.",
    )


def evaluate_architecture_design(req: ArchitectureEvaluationRequest) -> ArchitectureEvaluationResponse:
    """
    Evaluates system design submissions against common architectural pillars.
    """
    full_text = f"{req.requirements_scope} {req.high_level_design} {req.data_modeling} {req.scalability_tradeoffs}".lower()

    pillars_defined = [
        ("Capacity & Latency SLAs", [r"qps", r"latency", r"throughput", r"read/write", r"bandwidth", r"storage"]),
        ("API & Gateway Tier", [r"api gateway", r"rest", r"graphql", r"grpc", r"load balancer", r"reverse proxy"]),
        ("Caching Tier", [r"redis", r"memcached", r"cache", r"ttl", r"eviction", r"cdn"]),
        ("Database Architecture", [r"sql", r"nosql", r"postgres", r"mongodb", r"schema", r"index", r"acid", r"sharding"]),
        ("Asynchronous Processing & Queues", [r"kafka", r"rabbitmq", r"queue", r"async", r"event", r"pub/sub"]),
        ("Fault Tolerance & High Availability", [r"replica", r"redundancy", r"failover", r"cap theorem", r"partition", r"sla", r"circuit breaker"]),
    ]

    pillars_covered = []
    pillars_to_expand = []

    for name, patterns in pillars_defined:
        matched = any(re.search(pat, full_text) for pat in patterns)
        if matched:
            pillars_covered.append(name)
        else:
            pillars_to_expand.append(name)

    total_words = len(full_text.split())
    base_score = min(40, int((total_words / 250) * 40))
    pillar_score = int((len(pillars_covered) / len(pillars_defined)) * 60)
    score = min(100, base_score + pillar_score)

    if score >= 75:
        readiness = "Comprehensive"
    elif score >= 50:
        readiness = "Adequate"
    else:
        readiness = "Needs Depth"

    recommendations = []
    for missing in pillars_to_expand:
        recommendations.append(f"Consider addressing '{missing}' to ensure production viability under scale.")

    if total_words < 150:
        recommendations.append("Expand on data schemas, trade-offs between consistency and availability, and failure modes.")

    return ArchitectureEvaluationResponse(
        structural_score=score,
        readiness_level=readiness,
        pillars_covered=pillars_covered,
        pillars_to_expand=pillars_to_expand,
        recommendations=recommendations,
        disclaimer="This checklist evaluates architectural considerations against standard distributed systems best practices. It does not represent an automated hiring recommendation.",
    )


def audit_video_session(req: VideoAuditRequest) -> VideoAuditResponse:
    """
    Audits browser-recorded video metrics and reports honest AI gateway readiness.
    """
    mins = int(req.duration_seconds // 60)
    secs = int(req.duration_seconds % 60)
    duration_str = f"{mins:02d}:{secs:02d}"

    notes = [
        f"Media format recorded: {req.recorded_format}",
        f"Session duration: {duration_str} ({req.duration_seconds:.1f}s)",
    ]

    if req.face_detected_ratio is not None:
        notes.append(f"Observable camera framing: Face detected in approximately {int(req.face_detected_ratio * 100)}% of sampled frames.")
    else:
        notes.append("Camera framing: Media stream successfully captured.")

    if req.duration_seconds < 15.0:
        notes.append("Duration notice: Recording is under 15 seconds; brief answers may lack required technical depth.")
    elif req.duration_seconds > 180.0:
        notes.append("Duration notice: Recording exceeds 3 minutes; standard interview responses are ideally between 1 and 2.5 minutes.")

    # Transcription status
    if req.transcript_input and req.transcript_input.strip():
        transcription_status = "user_provided"
    else:
        transcription_status = "unconfigured"

    # AI feedback gateway status
    has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    ai_status = "available" if has_gemini else "unconfigured"

    rubric = [
        {
            "criterion": "Pacing & Speech Cadence",
            "benchmark": "130-150 words per minute",
            "guideline": "Maintain a measured tempo without rushing through complex technical terms.",
        },
        {
            "criterion": "Technical Articulation",
            "benchmark": "Specific API & Architectural references",
            "guideline": "Ground your explanations in concrete technologies, data structures, and trade-offs.",
        },
        {
            "criterion": "Structured Delivery",
            "benchmark": "Opening Summary -> Core Explanation -> Impact / Outcome",
            "guideline": "Avoid wandering narratives by stating your main point within the first 20 seconds.",
        },
    ]

    return VideoAuditResponse(
        recording_valid=True,
        duration_formatted=duration_str,
        stream_quality_notes=notes,
        transcription_status=transcription_status,
        ai_feedback_status=ai_status,
        rubric_guidelines=rubric,
        disclaimer="Video audit metrics are purely technical observations of the browser recording and do not measure candidate psychology, emotion, nervousness, or suitability.",
    )
