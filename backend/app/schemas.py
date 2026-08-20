from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source_lang: str = Field(default="auto")
    target_lang: str = Field(default="es")
    provider: Optional[str] = None

class TranslationResponse(BaseModel):
    id: Optional[int] = None
    source_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    detected_source: Optional[str] = None
    provider: str
    char_count: int
    created_at: datetime

class TranslationHistoryResponse(BaseModel):
    items: List[TranslationResponse]
    total: int

class FAQBase(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)
    answer: str = Field(..., min_length=3)
    category: str = Field(..., min_length=2, max_length=100)
    keywords: Optional[str] = None

class FAQCreate(FAQBase):
    pass

class FAQUpdate(BaseModel):
    question: Optional[str] = Field(None, min_length=3, max_length=500)
    answer: Optional[str] = Field(None, min_length=3)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    keywords: Optional[str] = None

class FAQResponse(FAQBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatQueryRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1)
    category_filter: Optional[str] = None

class RelatedFAQ(BaseModel):
    id: int
    question: str
    category: str
    similarity: float

class ChatQueryResponse(BaseModel):
    session_id: str
    user_message: str
    bot_response: str
    confidence: float
    intent_category: Optional[str] = None
    matched_faq_id: Optional[int] = None
    related_faqs: List[RelatedFAQ] = []
    is_fallback: bool = False
    timestamp: datetime

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat Session"

class ChatMessageResponse(BaseModel):
    id: int
    session_id: str
    sender: str
    message: str
    confidence: Optional[float] = None
    intent_category: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class DetectionConfigRequest(BaseModel):
    confidence_threshold: float = Field(0.5, ge=0.1, le=0.95)
    model_name: Optional[str] = "yolov8n.pt"

class DetectionEvent(BaseModel):
    track_id: int
    class_name: str
    confidence: float
    bbox: List[int]
    timestamp: float

class DetectionFrameSummary(BaseModel):
    fps: float
    object_count: int
    total_tracked_objects: int
    class_counts: Dict[str, int]
    detections: List[DetectionEvent]

class AnalyticsResponse(BaseModel):
    total_translations: int
    total_chat_sessions: int
    total_chat_messages: int
    total_faqs: int
    faq_match_rate: float
    unmatched_query_count: int
    total_detection_sessions: int
    top_faq_categories: Dict[str, int]
    top_detected_classes: Dict[str, int]

class HealthCheckResponse(BaseModel):
    status: str
    environment: str
    version: str
    database: str
    nlp_engine_ready: bool
    vision_model_ready: bool
    timestamp: datetime
