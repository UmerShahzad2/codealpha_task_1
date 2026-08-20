from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
from app.schemas import HealthCheckResponse
from app.services.nlp_engine import nlp_engine
from app.services.vision_tracker import vision_engine

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthCheckResponse)

@router.get("/api/v1/health", response_model=HealthCheckResponse)
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    return HealthCheckResponse(
        status="operational" if db_status == "healthy" else "degraded",
        environment=settings.ENVIRONMENT,
        version="1.0.0",
        database=db_status,
        nlp_engine_ready=nlp_engine.is_built,
        vision_model_ready=vision_engine.yolo_model is not None,
        timestamp=datetime.utcnow()
    )
