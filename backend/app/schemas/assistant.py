from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

PortalSection = Literal[
    "home",
    "resume-parser",
    "company-details",
    "interview-prep",
    "preparation-records",
    "resume-generator",
]


class AssistantHistoryItem(BaseModel):
    role: Literal["user", "assistant", "model"] = Field(..., description="Role of the speaker")
    text: str = Field(..., max_length=4000, description="Message text content")


class FileAttachment(BaseModel):
    file_name: str = Field(..., max_length=255, description="Original filename")
    mime_type: str = Field(..., description="Validated MIME type (e.g. image/png, image/jpeg, text/plain)")
    data_base64: str = Field(..., description="Base64 encoded file payload")


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User prompt text")
    section: PortalSection = Field("home", description="Currently active portal section")
    history: List[AssistantHistoryItem] = Field(default_factory=list, max_length=10, description="Recent conversation history turns")
    context_data: Optional[Dict[str, Any]] = Field(None, description="Safe summary context from the active section")
    file_attachment: Optional[FileAttachment] = Field(None, description="Optional image or document attachment")


class AssistantChatResponse(BaseModel):
    success: bool = Field(..., description="Whether request was handled successfully")
    reply: str = Field(..., description="Assistant response text")
    sender: str = Field("assistant", description="Sender identifier")
    is_ai_generated: bool = Field(..., description="True if response came from genuine Gemini API call")
    provider_status: Literal["configured", "unconfigured", "rate_limited", "error"] = Field(
        ..., description="Current status of the Gemini AI provider"
    )
    model_used: Optional[str] = Field(None, description="Name of the Gemini model used if AI generated")
    section_acknowledged: str = Field(..., description="Confirmed section context recognized by backend")
    suggestions: List[str] = Field(default_factory=list, description="Follow-up prompt starters")
    error_detail: Optional[str] = Field(None, description="Sanitized error details if provider failure occurred")


class AssistantStatusResponse(BaseModel):
    is_configured: bool = Field(..., description="True if GEMINI_API_KEY is configured in backend")
    status: Literal["ready", "unconfigured"] = Field(..., description="Provider readiness state")
    model: str = Field(..., description="Configured Gemini model identifier")
    max_message_chars: int = Field(4000, description="Maximum allowed characters per message")
    max_history_items: int = Field(10, description="Maximum history items accepted")
    supported_modalities: List[str] = Field(
        default_factory=lambda: ["text", "image", "speech_input", "speech_output"],
        description="Supported input and output modalities",
    )
    message: str = Field(..., description="Human-readable status and configuration guidance")
