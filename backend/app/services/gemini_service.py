import asyncio
import base64
import logging
import re
from typing import List, Dict, Any, Optional, Tuple

import httpx

from app.core.config import settings
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantStatusResponse,
    FileAttachment,
    PortalSection,
)

logger = logging.getLogger(__name__)

# Security & Quota Bounds
MAX_MESSAGE_CHARS = 4000
MAX_HISTORY_ITEMS = 10
MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024  # 2MB
ALLOWED_ATTACHMENT_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
}

SECTION_METADATA: Dict[PortalSection, Dict[str, Any]] = {
    "home": {
        "name": "Section 1: Home & Portfolio",
        "description": "Comprehensive career preparation, resume intelligence, and interview acceleration.",
        "starters": [
            "How can I maximize my resume's match rate for top tech companies?",
            "What is the recommended workflow to prepare for technical interviews?",
            "Can you help me plan a 4-week interview preparation roadmap?",
        ],
    },
    "resume-parser": {
        "name": "Section 2: Resume Parser",
        "description": "High-accuracy text parsing, skill detection, and transparent ATS compatibility diagnostics.",
        "starters": [
            "How do top tech ATS parsers score quantifiable metrics and impact verbs?",
            "How can I highlight system architecture and cloud skills on my resume?",
            "What formatting mistakes commonly cause resumes to fail ATS scans?",
        ],
    },
    "company-details": {
        "name": "Section 3: Company Matching",
        "description": "Employer tech stack alignment, hiring stage insights, and candidate matching across 52 verified tech firms.",
        "starters": [
            "What technical skills do tier-1 tech companies prioritize most in 2026?",
            "How should I research an engineering team's tech stack before an interview?",
            "What smart architectural questions should I ask engineering interviewers?",
        ],
    },
    "interview-prep": {
        "name": "Section 4: Adaptive Interview",
        "description": "Multi-language coding sandbox, algorithmic problem solving, STAR behavioral rubric, and video presentation drills.",
        "starters": [
            "How do I structure a behavioral answer using the STAR framework?",
            "Explain how to optimize an algorithmic problem from O(N^2) to O(N) using a hash map.",
            "Can you explain the key tradeoffs between SQL and NoSQL in system design?",
        ],
    },
    "preparation-records": {
        "name": "Section 5: Preparation History",
        "description": "Persistent performance tracking, practice submissions, and skill mastery trends.",
        "starters": [
            "How can I analyze my strengths and gaps across coding and behavioral drills?",
            "What metrics should I focus on to improve my coding interview speed?",
            "How should I organize my daily practice routine across DSA and behavioral topics?",
        ],
    },
    "resume-generator": {
        "name": "Section 6: ATS Resume Tailoring",
        "description": "Tailored, single-column ATS-compliant resume builder with PDF and Word DOCX export.",
        "starters": [
            "How do I rewrite an experience bullet using the Google 'Accomplished [X] by doing [Z]' formula?",
            "Help me write an impactful 3-sentence professional summary for a software engineer.",
            "How can I present personal and open-source projects to impress engineering managers?",
        ],
    },
}

BASE_SYSTEM_INSTRUCTION = """You are the AI Career & Technical Co-pilot for CareerNova AI.

Your role is to empower candidates to excel in software engineering, cloud, data, and technical career opportunities through direct, actionable mentorship, algorithmic coaching, and resume optimization.

CORE OPERATIONAL PRINCIPLES:
1. DIRECT, HIGH-VALUE MENTORSHIP: Always answer candidate questions directly, constructively, and concisely. Never dump robotic meta-commentary, section listings, or internal system status disclaimers.
2. PRODUCTION-READY CAPABILITIES: All platform features are fully active and production-backed:
   - 52 verified technology employers with real-world hiring stages and tech stacks.
   - Live code execution sandbox with multi-language support (Python, C++, Java, JS, TS).
   - Real-time ATS resume diagnostics and formatting guidance.
   - Persistent PostgreSQL database storage for preparation analytics.
3. CONCRETE ACTIONABILITY:
   - When asked about coding or algorithms, provide clean code examples, time/space complexity analysis (Big-O), and edge case considerations.
   - When asked about resumes, suggest impactful bullets formatted as: "Accomplished [X] as measured by [Y], by doing [Z]".
   - When asked about behavioral interviews, structure answers using the STAR method (Situation, Task, Action, Result).
4. TONE & STYLE: Professional, encouraging, technical, precise, and practical. Avoid unnecessary corporate fluff or repetitive warnings.
"""


def _get_api_key() -> str:
    """Retrieves and validates the configured GEMINI_API_KEY from backend settings."""
    key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    return key


def get_gemini_status() -> AssistantStatusResponse:
    """Returns safe, non-sensitive gateway status without exposing keys or credentials."""
    api_key = _get_api_key()
    is_configured = bool(api_key and not api_key.startswith("your_") and len(api_key) > 10)

    if is_configured:
        message = (
            f"Gemini AI Gateway is active and connected using model '{settings.GEMINI_MODEL}'. "
            "All six portal sections are equipped with real-time AI assistance."
        )
        status_str = "ready"
    else:
        message = (
            "Gemini API key is not configured in backend settings. "
            "To activate live AI responses, set GEMINI_API_KEY in backend/.env. "
            "All deterministic features (Resume Parser, Resume Generator, heuristic rubrics) remain fully operational."
        )
        status_str = "unconfigured"

    return AssistantStatusResponse(
        is_configured=is_configured,
        status=status_str,
        model=settings.GEMINI_MODEL,
        max_message_chars=MAX_MESSAGE_CHARS,
        max_history_items=MAX_HISTORY_ITEMS,
        supported_modalities=["text", "image", "speech_input", "speech_output"],
        message=message,
    )


def _build_section_context_prompt(section: PortalSection, context_data: Optional[Dict[str, Any]] = None) -> str:
    """Builds constrained section-specific instruction prompt."""
    meta = SECTION_METADATA.get(section, SECTION_METADATA["home"])
    prompt = f"\nACTIVE CONTEXT: The user is currently in {meta['name']}.\n"
    prompt += f"Context Focus: {meta['description']}\n"

    if section == "home":
        prompt += "Guidance: Provide high-impact career advice, interview strategy, and workflow guidance.\n"
    elif section == "resume-parser":
        prompt += "Guidance: Help interpret resume strengths, skill extraction, and concrete ATS optimization tips.\n"
    elif section == "company-details":
        prompt += "Guidance: Share practical advice on tech stack alignment, company research, and engineering interview expectations across top firms.\n"
    elif section == "interview-prep":
        prompt += "Guidance: Provide clear explanations of algorithms, data structures, STAR behavioral methods, and architectural tradeoffs.\n"
    elif section == "preparation-records":
        prompt += "Guidance: Help the candidate evaluate practice habits, benchmark progress, and set targeted improvement goals.\n"
    elif section == "resume-generator":
        prompt += "Guidance: Help craft compelling, metric-driven resume bullets and crisp professional summaries.\n"

    if context_data:
        # Include safe, non-sensitive summary counts without full raw file dumps
        safe_context_lines = []
        for k, v in context_data.items():
            if isinstance(v, (int, float, bool, str)) and len(str(v)) < 200:
                safe_context_lines.append(f"- {k}: {v}")
        if safe_context_lines:
            prompt += "Section Summary Data Provided by Client:\n" + "\n".join(safe_context_lines) + "\n"

    return prompt


def _validate_attachment(attachment: Optional[FileAttachment]) -> Optional[Tuple[str, str]]:
    """
    Validates file attachment MIME type and payload size.
    Returns (mime_type, base64_payload) or None.
    Raises ValueError on invalid attachment.
    """
    if not attachment:
        return None

    mime_type = attachment.mime_type.lower().strip()
    if mime_type not in ALLOWED_ATTACHMENT_MIME_TYPES:
        raise ValueError(
            f"Unsupported attachment type '{mime_type}'. Supported types: {', '.join(sorted(ALLOWED_ATTACHMENT_MIME_TYPES))}"
        )

    try:
        raw_bytes = base64.b64decode(attachment.data_base64)
    except Exception:
        raise ValueError("Invalid Base64 attachment payload.")

    if len(raw_bytes) > MAX_ATTACHMENT_BYTES:
        raise ValueError(
            f"Attachment exceeds maximum allowed limit of 2MB (received {len(raw_bytes)} bytes)."
        )

    return (mime_type, attachment.data_base64)


def _build_unconfigured_fallback_reply(
    section: PortalSection, user_message: str, context_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Provides a concise, high-value career guidance response when GEMINI_API_KEY is not configured.
    """
    reply = (
        f"[Notice: Gemini Unconfigured]\n\n"
        f"Here are actionable recommendations regarding **{user_message[:80]}**:\n\n"
    )

    if section == "home":
        reply += (
            "1. **Resume Targeting**: Align quantifiable metrics (impact percentages, latency reductions, user scale) with job descriptions.\n"
            "2. **Algorithm Mastery**: Focus on core patterns — Two Pointers, Sliding Window, DFS/BFS, Dynamic Programming, and Topological Sort.\n"
            "3. **Mock Drills**: Time your solutions strictly to 25–30 minutes, articulating time and space complexity before coding."
        )
    elif section == "resume-parser":
        reply += (
            "1. **Action Verbs**: Start bullet points with strong power verbs (e.g., *Engineered*, *Architected*, *Optimized*, *Accelerated*).\n"
            "2. **Google X-Y-Z Formula**: Format achievements as: *Accomplished [X] as measured by [Y], by doing [Z]*.\n"
            "3. **ATS Formatting**: Keep single-column layouts and avoid complex multi-column tables or embedded images in headers."
        )
    elif section == "company-details":
        reply += (
            "1. **Tech Stack Mapping**: Review target company engineering blogs and GitHub repositories to understand their production architecture.\n"
            "2. **Interview Stages**: Prepare for 1 Recruiter Screen, 1 Technical Phone Screen (DSA/Coding), and 3-4 Onsite Rounds (Coding, System Design, Behavioral).\n"
            "3. **Reverse Interviewing**: Prepare 2-3 deep questions about CI/CD bottlenecks, architectural tradeoffs, and on-call rotation health."
        )
    elif section == "interview-prep":
        reply += (
            "1. **Clarify Requirements**: Clarify inputs, edge cases (empty inputs, nulls, negative values, large scales) before writing code.\n"
            "2. **State Complexity**: Always state Big-O Time and Space complexity before and after optimization.\n"
            "3. **STAR Method**: For behavioral questions, allocate 20% to Situation/Task, 60% to your specific Actions, and 20% to measurable Results."
        )
    elif section == "preparation-records":
        reply += (
            "1. **Consistency**: Track your speed and error rate across easy, medium, and hard coding challenges.\n"
            "2. **Spaced Repetition**: Re-attempt challenging problems within 3 to 5 days to cement algorithmic patterns.\n"
            "3. **Balanced Practice**: Balance 70% data structures & algorithms with 30% system design and behavioral drills."
        )
    elif section == "resume-generator":
        reply += (
            "1. **Quantify Results**: Replace vague descriptions with specific business metrics (e.g., 'reduced API latency by 45%').\n"
            "2. **Role Tailoring**: Highlight the exact languages, frameworks, and cloud services required by the specific job opening.\n"
            "3. **Single Page Rule**: Keep early and mid-career resumes strictly to one well-formatted, scannable page."
        )

    return reply


async def call_gemini_api(
    system_instruction: str,
    user_message: str,
    history: List[Dict[str, Any]],
    attachment_info: Optional[Tuple[str, str]] = None,
) -> Tuple[bool, str, Optional[str]]:
    """
    Executes a typed HTTP request to the official Google Gemini REST API.
    Handles network failures, timeouts, rate limits, and provider errors safely.
    Returns (success, response_text_or_error_message, error_code).
    """
    api_key = _get_api_key()
    if not api_key:
        return (False, "Gemini API key is not configured.", "UNCONFIGURED")

    model = settings.GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    # Format contents conversation structure
    contents: List[Dict[str, Any]] = []

    # Format history turns
    for turn in history[-MAX_HISTORY_ITEMS:]:
        role = "user" if turn.get("role") in ("user",) else "model"
        text = str(turn.get("text", "")).strip()
        if text:
            contents.append({"role": role, "parts": [{"text": text[:MAX_MESSAGE_CHARS]}]})

    # Prepare current user turn parts
    user_parts: List[Dict[str, Any]] = []

    # Optional image attachment
    if attachment_info:
        mime_type, b64_data = attachment_info
        if mime_type.startswith("image/"):
            user_parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": b64_data,
                }
            })
        elif mime_type == "text/plain":
            try:
                decoded_text = base64.b64decode(b64_data).decode("utf-8", errors="replace")
                user_parts.append({"text": f"[Attached Document Content]:\n{decoded_text[:2000]}\n"})
            except Exception:
                pass

    user_parts.append({"text": user_message})
    contents.append({"role": "user", "parts": user_parts})

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": settings.GEMINI_TEMPERATURE,
            "maxOutputTokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
        },
    }

    # Bounded retry policy (max 1 retry for transient 503/504 errors)
    retries = 1
    timeout_sec = float(settings.GEMINI_TIMEOUT_SECONDS)

    for attempt in range(retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout_sec) as client:
                response = await client.post(url, headers=headers, json=payload)

                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                        parts = candidates[0]["content"]["parts"]
                        reply_text = "".join(part.get("text", "") for part in parts).strip()
                        if reply_text:
                            return (True, reply_text, None)
                    return (False, "Gemini returned an empty candidate response.", "EMPTY_RESPONSE")

                elif response.status_code in (401, 403):
                    return (
                        False,
                        "Gemini API authentication failed. The configured GEMINI_API_KEY is invalid or unauthorized.",
                        "INVALID_CREDENTIALS",
                    )
                elif response.status_code == 429:
                    return (
                        False,
                        "Gemini API rate limit or quota exceeded. Please wait a moment before resending.",
                        "RATE_LIMITED",
                    )
                elif response.status_code in (500, 502, 503, 504):
                    if attempt < retries:
                        await asyncio.sleep(1.0)
                        continue
                    return (
                        False,
                        f"Google Gemini service is temporarily unavailable (HTTP {response.status_code}). Please try again later.",
                        "PROVIDER_ERROR",
                    )
                else:
                    return (
                        False,
                        f"Gemini API returned unexpected HTTP status {response.status_code}.",
                        "PROVIDER_ERROR",
                    )

        except httpx.TimeoutException:
            if attempt < retries:
                await asyncio.sleep(1.0)
                continue
            return (
                False,
                f"Gemini request timed out after {timeout_sec:.0f} seconds.",
                "TIMEOUT",
            )
        except httpx.RequestError as exc:
            if attempt < retries:
                await asyncio.sleep(1.0)
                continue
            return (
                False,
                f"Network communication failure connecting to Gemini API: {type(exc).__name__}",
                "NETWORK_FAILURE",
            )
        except Exception as exc:
            return (
                False,
                f"An internal error occurred while communicating with Gemini: {type(exc).__name__}",
                "INTERNAL_ERROR",
            )

    return (False, "Unable to complete request to Gemini API.", "UNKNOWN_ERROR")


async def handle_chat_request(req: AssistantChatRequest) -> AssistantChatResponse:
    """
    Orchestrates assistant message handling:
    1. Validates inputs and payload constraints.
    2. Inspects gateway readiness.
    3. Dispatches genuine Gemini query or structured unconfigured fallback.
    4. Attaches section-aware suggestions.
    """
    clean_message = req.message.strip()
    if not clean_message:
        return AssistantChatResponse(
            success=False,
            reply="Message cannot be empty. Please enter a question or prompt.",
            sender="assistant",
            is_ai_generated=False,
            provider_status="error",
            section_acknowledged=SECTION_METADATA.get(req.section, SECTION_METADATA["home"])["name"],
            suggestions=SECTION_METADATA.get(req.section, SECTION_METADATA["home"])["starters"],
            error_detail="EMPTY_PROMPT",
        )

    # Validate attachment if present
    attachment_info = None
    if req.file_attachment:
        try:
            attachment_info = _validate_attachment(req.file_attachment)
        except ValueError as err:
            return AssistantChatResponse(
                success=False,
                reply=f"Attachment validation failed: {str(err)}",
                sender="assistant",
                is_ai_generated=False,
                provider_status="error",
                section_acknowledged=SECTION_METADATA.get(req.section, SECTION_METADATA["home"])["name"],
                suggestions=SECTION_METADATA.get(req.section, SECTION_METADATA["home"])["starters"],
                error_detail="INVALID_ATTACHMENT",
            )

    status_obj = get_gemini_status()
    meta = SECTION_METADATA.get(req.section, SECTION_METADATA["home"])

    # If Gemini is unconfigured, return honest deterministic guidance
    if not status_obj.is_configured:
        fallback_reply = _build_unconfigured_fallback_reply(
            section=req.section,
            user_message=clean_message,
            context_data=req.context_data,
        )
        return AssistantChatResponse(
            success=True,
            reply=fallback_reply,
            sender="assistant",
            is_ai_generated=False,
            provider_status="unconfigured",
            model_used=None,
            section_acknowledged=meta["name"],
            suggestions=meta["starters"],
            error_detail=None,
        )

    # Gemini is configured: build structured system instruction and execute real call
    section_instruction = _build_section_context_prompt(req.section, req.context_data)
    system_instruction = BASE_SYSTEM_INSTRUCTION + "\n" + section_instruction

    history_dicts = [{"role": item.role, "text": item.text} for item in req.history]

    success, result_text, error_code = await call_gemini_api(
        system_instruction=system_instruction,
        user_message=clean_message,
        history=history_dicts,
        attachment_info=attachment_info,
    )

    if success:
        return AssistantChatResponse(
            success=True,
            reply=result_text,
            sender="assistant",
            is_ai_generated=True,
            provider_status="configured",
            model_used=settings.GEMINI_MODEL,
            section_acknowledged=meta["name"],
            suggestions=meta["starters"],
            error_detail=None,
        )
    else:
        # Provider returned an error (rate limit, quota, timeout, network)
        provider_status_code = "rate_limited" if error_code == "RATE_LIMITED" else "error"
        error_notice = (
            f"**[AI Gateway Notice — Provider Error]**\n\n"
            f"{result_text}\n\n"
            f"Context: {meta['name']}. Deterministic features of this section remain operational."
        )
        return AssistantChatResponse(
            success=False,
            reply=error_notice,
            sender="assistant",
            is_ai_generated=False,
            provider_status=provider_status_code,
            model_used=settings.GEMINI_MODEL,
            section_acknowledged=meta["name"],
            suggestions=meta["starters"],
            error_detail=error_code,
        )
