import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./data/nexus_ai.db"
    SECRET_KEY: str = "nexus_ai_lab_secret_key_production_grade_2026"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    DEFAULT_TRANSLATION_PROVIDER: str = "deep_translator"
    DEFAULT_TARGET_LANGUAGE: str = "es"
    SIMILARITY_THRESHOLD: float = 0.20
    MAX_CHAT_HISTORY: int = 50
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    DETECTION_CONFIDENCE_THRESHOLD: float = 0.5
    MAX_TRACKING_DISAPPEARED: int = 15

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
