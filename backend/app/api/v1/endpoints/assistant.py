from fastapi import APIRouter, HTTPException, status
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantStatusResponse,
)
from app.services.gemini_service import get_gemini_status, handle_chat_request

router = APIRouter()


@router.get(
    "/status",
    response_model=AssistantStatusResponse,
    summary="Get centralized Gemini AI Gateway status and supported modalities",
)
async def check_assistant_status() -> AssistantStatusResponse:
    """
    Returns the real-time configuration state of the centralized Gemini AI Gateway.
    Safely reports whether GEMINI_API_KEY is configured without exposing secrets or credentials.
    """
    return get_gemini_status()


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    summary="Send prompt to centralized Gemini AI Gateway with section context",
)
async def send_chat_message(request: AssistantChatRequest) -> AssistantChatResponse:
    """
    Routes a user prompt through the centralized Gemini AI Gateway.
    Validates input size, enforces security boundaries, applies active section context,
    and returns a typed, verified response or honest deterministic unconfigured notice.
    """
    try:
        response = await handle_chat_request(request)
        return response
    except Exception as exc:
        # Prevent leaking stack traces or internal server details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the assistant request.",
        )
