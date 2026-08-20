import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import FAQItem
from app.services.nlp_engine import nlp_engine
from app.utils.logger import logger

from app.api.translation import router as translation_router
from app.api.faq import router as faq_router
from app.api.chatbot import router as chatbot_router
from app.api.vision import router as vision_router
from app.api.analytics import router as analytics_router
from app.api.health import router as health_router

app = FastAPI(
    title="NEXUS AI LAB API Suite",
    description="Unified API platform powering LinguaFlow, FAQMind, and VisionTrack AI modules.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully")

    db = SessionLocal()
    try:
        faq_count = db.query(FAQItem).count()
        if faq_count == 0:
            seed_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "nexus_faqs.json")
            if os.path.exists(seed_file):
                with open(seed_file, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item_data in items:
                        item = FAQItem(
                            question=item_data["question"],
                            answer=item_data["answer"],
                            category=item_data["category"],
                            keywords=item_data.get("keywords", "")
                        )
                        db.add(item)
                    db.commit()
                    logger.info(f"Seeded {len(items)} default FAQs into database")

        all_faqs = db.query(FAQItem).all()
        faq_list = [
            {
                "id": f.id,
                "question": f.question,
                "answer": f.answer,
                "category": f.category,
                "keywords": f.keywords
            } for f in all_faqs
        ]
        nlp_engine.build_index(faq_list)
    finally:
        db.close()

app.include_router(health_router)
app.include_router(translation_router)
app.include_router(faq_router)
app.include_router(chatbot_router)
app.include_router(vision_router)
app.include_router(analytics_router)
