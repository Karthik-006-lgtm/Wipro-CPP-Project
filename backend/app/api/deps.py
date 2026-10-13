from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_token
from app.models.user import User, UserSession

security_scheme = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Returns the authenticated User if a valid Bearer token is provided and active in user_sessions;
    otherwise returns None without raising an HTTP exception.
    """
    if not credentials or not credentials.credentials:
        return None

    raw_token = credentials.credentials
    token_hashed = hash_token(raw_token)
    now = datetime.now(timezone.utc)

    session = (
        db.query(UserSession)
        .filter(
            UserSession.token_hash == token_hashed,
            UserSession.is_active == True,
            UserSession.expires_at > now,
        )
        .first()
    )

    if not session or not session.user or not session.user.is_active:
        return None

    return session.user


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """
    Requires an authenticated User. Raises 401 Unauthorized if not authenticated or session expired.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
