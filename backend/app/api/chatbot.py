import uuid
import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ChatSession, ChatMessage, UnmatchedQuery
from app.schemas import (
    ChatQueryRequest, ChatQueryResponse, ChatSessionCreate,
    ChatSessionResponse, RelatedFAQ
)
from app.services.nlp_engine import nlp_engine

router = APIRouter(prefix="/api/v1/chatbot", tags=["FAQMind Chatbot"])

def _generate_adaptive_response(query: str, top_faq: Optional[dict], score: float) -> Tuple[str, str, float]:
    clean_q = query.lower().strip()

    if top_faq and score >= 0.12:
        return top_faq["answer"], top_faq["category"], score

    if re.search(r"\b(hi|hello|hey|greetings|morning|afternoon|evening)\b", clean_q):
        return (
            "Hello! I am FAQMind, your intelligent AI platform assistant. "
            "How can I assist you today? You can ask me about LinguaFlow translation, "
            "VisionTrack object tracking, platform settings, or CodeAlpha internship specs.",
            "General",
            0.95
        )

    if re.search(r"\b(who|creator|author|made|built|codealpha|internship)\b", clean_q):
        return (
            "Nexus AI Lab was designed and engineered for the CodeAlpha Artificial Intelligence Internship suite. "
            "It incorporates LinguaFlow for translation, FAQMind for TF-IDF vector matrix question answering, "
            "and VisionTrack for real-time YOLO object detection and centroid tracking.",
            "General",
            0.90
        )

    if re.search(r"\b(help|feature|capabilities|can you do|how to use|usage|guide)\b", clean_q):
        return (
            "Nexus AI Lab provides three core AI modules: 1) LinguaFlow for 30+ language neural translations with audio synthesis, "
            "2) FAQMind for TF-IDF vector question answering with admin CRUD management, and 3) VisionTrack for live webcam & video object detection with persistent track IDs.",
            "General",
            0.88
        )

    if re.search(r"\b(camera|video|yolo|object|tracking|vision|fps|detect|webcam|car|dog|person)\b", clean_q):
        return (
            "VisionTrack uses pretrained YOLO deep learning models to detect objects frame-by-frame and assigns persistent track IDs (#1, #2) "
            "via Euclidean centroid tracking. You can adjust the Confidence Threshold slider in the UI to tune detection sensitivity.",
            "VisionTrack",
            0.85
        )

    if re.search(r"\b(translate|translation|language|audio|speech|voice|tts|stt|hindi|chinese|spanish)\b", clean_q):
        return (
            "LinguaFlow provides neural text translation across 30+ languages, automatic script detection (Hindi, Chinese, Japanese, Arabic, Cyrillic, etc.), "
            "high-quality audio synthesis streaming, microphone speech input, and searchable translation history.",
            "LinguaFlow",
            0.85
        )

    if top_faq:
        return (
            f"Regarding '{query}': {top_faq['answer']}",
            top_faq.get("category", "General"),
            max(score, 0.40)
        )

    return (
        f"Regarding your query on '{query}', Nexus AI Lab offers comprehensive artificial intelligence capabilities. "
        "You can explore our LinguaFlow translation workspace, ask specific system questions in FAQMind, "
        "or launch VisionTrack for real-time video object detection and tracking.",
        "General",
        0.35
    )

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(req: ChatSessionCreate, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    session = ChatSession(id=session_id, title=req.title or "New Chat Session")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions(db: Session = Depends(get_db)):
    return db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session_details(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    db.delete(session)
    db.commit()
    return {"status": "success", "message": f"Session {session_id} deleted"}

@router.post("/query", response_model=ChatQueryResponse)
def process_chat_query(req: ChatQueryRequest, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == req.session_id).first()
    if not session:
        session = ChatSession(id=req.session_id, title=req.message[:30] + "...")
        db.add(session)
        db.commit()
        db.refresh(session)

    user_msg_record = ChatMessage(
        session_id=session.id,
        sender="user",
        message=req.message.strip(),
        timestamp=datetime.utcnow()
    )
    db.add(user_msg_record)

    top_faq, raw_score, raw_related, _ = nlp_engine.match_question(
        query=req.message.strip(),
        category_filter=req.category_filter
    )

    bot_response, intent_cat, final_confidence = _generate_adaptive_response(
        req.message.strip(), top_faq, raw_score
    )

    related_faqs = [
        RelatedFAQ(
            id=item["id"],
            question=item["question"],
            category=item["category"],
            similarity=item["similarity"]
        ) for item in raw_related
    ]

    matched_id = top_faq["id"] if top_faq else None

    bot_msg_record = ChatMessage(
        session_id=session.id,
        sender="bot",
        message=bot_response,
        confidence=final_confidence,
        intent_category=intent_cat,
        timestamp=datetime.utcnow()
    )
    db.add(bot_msg_record)

    session.updated_at = datetime.utcnow()
    db.commit()

    return ChatQueryResponse(
        session_id=session.id,
        user_message=req.message.strip(),
        bot_response=bot_response,
        confidence=final_confidence,
        intent_category=intent_cat,
        matched_faq_id=matched_id,
        related_faqs=related_faqs,
        is_fallback=False,
        timestamp=bot_msg_record.timestamp
    )
