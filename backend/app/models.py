from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class TranslationHistory(Base):
    __tablename__ = "translation_history"

    id = Column(Integer, primary_key=True, index=True)
    source_lang = Column(String(20), nullable=False)
    target_lang = Column(String(20), nullable=False)
    source_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    provider = Column(String(50), default="deep_translator")
    char_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class FAQItem(Base):
    __tablename__ = "faq_items"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(500), nullable=False, index=True)
    answer = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    keywords = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    confidence = Column(Float, nullable=True)
    intent_category = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class UnmatchedQuery(Base):
    __tablename__ = "unmatched_queries"

    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(Text, nullable=False)
    similarity_score = Column(Float, default=0.0)
    category_tried = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class DetectionSession(Base):
    __tablename__ = "detection_sessions"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String(50), nullable=False)
    duration_seconds = Column(Float, default=0.0)
    total_frames = Column(Integer, default=0)
    total_objects_tracked = Column(Integer, default=0)
    class_counts_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
