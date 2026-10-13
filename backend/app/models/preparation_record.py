from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PreparationRecord(Base):
    __tablename__ = "preparation_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    practice_type = Column(String(50), nullable=False, index=True)  # 'coding', 'architecture', 'company', 'behavioral', 'video'
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="completed")  # 'completed', 'draft', 'structured', etc.
    summary = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)
    session_metadata = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="preparation_records")
