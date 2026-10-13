import time
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

Base = declarative_base()

# Configure SQLAlchemy engine with safe connection arguments and timeouts
connect_args = {
    "connect_timeout": 3,
}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args=connect_args,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    engine = None
    SessionLocal = None


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and safely closes it."""
    if SessionLocal is None:
        raise RuntimeError("Database session factory is not initialized.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_health() -> Dict[str, Any]:
    """
    Safely tests database connectivity.
    Returns status without leaking connection strings, passwords, or host specifics.
    """
    if engine is None:
        return {
            "status": "unconfigured",
            "connected": False,
            "message": "Database engine could not be initialized.",
            "latency_ms": None,
        }

    start_time = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "connected",
            "connected": True,
            "message": "PostgreSQL database connection verified successfully.",
            "latency_ms": latency,
        }
    except Exception as exc:
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        # Extract a sanitized error message (omit passwords and full connection strings)
        raw_msg = str(exc)
        if "fe_sendauth" in raw_msg or "password authentication failed" in raw_msg:
            safe_msg = "Authentication failed: valid database credentials required."
        elif "connection refused" in raw_msg.lower() or "could not connect" in raw_msg.lower():
            safe_msg = "Database host is unreachable or service is stopped."
        elif "does not exist" in raw_msg.lower():
            safe_msg = "Target database does not exist on the PostgreSQL server."
        else:
            safe_msg = "Database connectivity check failed (check configuration)."

        return {
            "status": "unreachable",
            "connected": False,
            "message": safe_msg,
            "latency_ms": latency,
        }
