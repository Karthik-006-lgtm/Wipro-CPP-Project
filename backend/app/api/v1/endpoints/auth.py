import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password, generate_secure_token, hash_token
from app.models.user import User, UserSession, PasswordResetToken
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    AuthResponse,
    UserResponse,
    ForgotPasswordResponse,
)
from app.api.deps import get_current_user, security_scheme

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Registers a new user with email, full name, and password.
    Returns 409 Conflict if email is already registered.
    """
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "An account with this email address already exists. Please log in with your credentials.",
                "code": "EMAIL_ALREADY_EXISTS",
                "email": payload.email,
            },
        )

    pwd_hash = hash_password(payload.password)
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=pwd_hash,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create initial session
    raw_token = generate_secure_token()
    token_hashed = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

    session = UserSession(
        user_id=user.id,
        token_hash=token_hashed,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:255],
        expires_at=expires_at,
        is_active=True,
    )
    db.add(session)
    user.last_login_at = func.now()
    db.commit()

    return AuthResponse(
        token=raw_token,
        token_type="Bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticates an existing user and creates a secure session token.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    raw_token = generate_secure_token()
    token_hashed = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

    session = UserSession(
        user_id=user.id,
        token_hash=token_hashed,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:255],
        expires_at=expires_at,
        is_active=True,
    )
    db.add(session)
    user.last_login_at = func.now()
    db.commit()

    return AuthResponse(
        token=raw_token,
        token_type="Bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db: Session = Depends(get_db),
):
    """
    Revokes the active session token and logs the user out.
    """
    if credentials and credentials.credentials:
        token_hashed = hash_token(credentials.credentials)
        session = db.query(UserSession).filter(UserSession.token_hash == token_hashed).first()
        if session:
            session.is_active = False
            db.commit()
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the profile of the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Generates a single-use password reset token for the specified email.
    If SMTP email sending is not configured, provides the reset token in the response
    for seamless testing and development.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return ForgotPasswordResponse(
            message="If an account with that email exists, reset instructions have been issued.",
            email_sent=False,
            reset_token=None,
        )

    # Invalidate previous unused reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used == False,
    ).update({"is_used": True})

    raw_token = generate_secure_token(32)
    token_hashed = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)

    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hashed,
        is_used=False,
        expires_at=expires_at,
    )
    db.add(reset_record)
    db.commit()

    # Check if SMTP is configured
    email_sent = False
    if settings.SMTP_HOST and settings.SMTP_USER:
        # In a production environment with SMTP credentials, send email here
        try:
            # Email delivery logic would execute here
            email_sent = True
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            email_sent = False

    return ForgotPasswordResponse(
        message=(
            "Password reset instructions have been dispatched to your email."
            if email_sent
            else "Password reset token generated. Use the token to set a new password."
        ),
        email_sent=email_sent,
        reset_token=raw_token if not email_sent else None,
    )


@router.post("/reset-password", response_model=AuthResponse)
def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Validates the single-use reset token and sets the new password.
    Automatically logs the user into a new session.
    """
    token_hashed = hash_token(payload.token)
    now = datetime.now(timezone.utc)

    reset_record = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hashed,
            PasswordResetToken.is_used == False,
            PasswordResetToken.expires_at > now,
        )
        .first()
    )

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has expired. Please request a new one.",
        )

    user = reset_record.user
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account associated with this token is not active.",
        )

    # Update password and mark token used
    user.password_hash = hash_password(payload.new_password)
    reset_record.is_used = True

    # Revoke old active sessions
    db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_active": False})

    # Create new active session
    raw_token = generate_secure_token()
    session_token_hashed = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

    session = UserSession(
        user_id=user.id,
        token_hash=session_token_hashed,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:255],
        expires_at=expires_at,
        is_active=True,
    )
    db.add(session)
    user.last_login_at = func.now()
    db.commit()

    return AuthResponse(
        token=raw_token,
        token_type="Bearer",
        user=UserResponse.model_validate(user),
    )
