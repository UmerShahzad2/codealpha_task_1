import json
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import TranslationHistory, ChatSession, ChatMessage, FAQItem, UnmatchedQuery, DetectionSession
from app.schemas import AnalyticsResponse

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    total_translations = db.query(func.count(TranslationHistory.id)).scalar() or 0
    total_chat_sessions = db.query(func.count(ChatSession.id)).scalar() or 0
    total_chat_messages = db.query(func.count(ChatMessage.id)).scalar() or 0
    total_faqs = db.query(func.count(FAQItem.id)).scalar() or 0
    unmatched_query_count = db.query(func.count(UnmatchedQuery.id)).scalar() or 0
    total_detection_sessions = db.query(func.count(DetectionSession.id)).scalar() or 0

    bot_messages = db.query(ChatMessage).filter(ChatMessage.sender == "bot").all()
    matched_count = 0
    for msg in bot_messages:
        if msg.intent_category and msg.intent_category != "Unmatched":
            matched_count += 1

    total_bot_queries = len(bot_messages)
    faq_match_rate = round((matched_count / total_bot_queries * 100), 1) if total_bot_queries > 0 else 100.0

    faq_category_rows = db.query(FAQItem.category, func.count(FAQItem.id)).group_by(FAQItem.category).all()
    top_faq_categories = {row[0]: row[1] for row in faq_category_rows}

    detection_sessions = db.query(DetectionSession).all()
    class_counter = Counter()
    for s in detection_sessions:
        if s.class_counts_json:
            try:
                counts = json.loads(s.class_counts_json)
                for cls_name, count in counts.items():
                    class_counter[cls_name] += count
            except Exception:
                pass

    top_detected_classes = dict(class_counter.most_common(10))

    return AnalyticsResponse(
        total_translations=total_translations,
        total_chat_sessions=total_chat_sessions,
        total_chat_messages=total_chat_messages,
        total_faqs=total_faqs,
        faq_match_rate=faq_match_rate,
        unmatched_query_count=unmatched_query_count,
        total_detection_sessions=total_detection_sessions,
        top_faq_categories=top_faq_categories,
        top_detected_classes=top_detected_classes
    )
