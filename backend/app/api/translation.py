from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import TranslationHistory
from app.schemas import TranslationRequest, TranslationResponse, TranslationHistoryResponse
from app.services.translation_service import translation_service

from fastapi.responses import Response

router = APIRouter(prefix="/api/v1/translate", tags=["Translation"])

@router.get("/languages")
def get_languages():
    return translation_service.get_supported_languages()

@router.get("/tts")
def get_tts_audio(text: str = Query(...), lang: str = Query("en")):
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text parameter cannot be empty")
    audio_bytes = translation_service.synthesize_speech(text, lang)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Failed to synthesize TTS audio stream")
    return Response(content=audio_bytes, media_type="audio/mpeg")

@router.post("", response_model=TranslationResponse)
def translate_text(req: TranslationRequest, db: Session = Depends(get_db)):
    if not req.text or not req.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source text cannot be empty"
        )

    translated_text, detected_src, provider = translation_service.translate(
        text=req.text,
        source_lang=req.source_lang,
        target_lang=req.target_lang,
        provider=req.provider or "deep_translator"
    )

    record = TranslationHistory(
        source_lang=detected_src,
        target_lang=req.target_lang,
        source_text=req.text,
        translated_text=translated_text,
        provider=provider,
        char_count=len(req.text)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return TranslationResponse(
        id=record.id,
        source_text=record.source_text,
        translated_text=record.translated_text,
        source_lang=record.source_lang,
        target_lang=record.target_lang,
        detected_source=detected_src if req.source_lang == "auto" else None,
        provider=record.provider,
        char_count=record.char_count,
        created_at=record.created_at
    )

@router.get("/history", response_model=TranslationHistoryResponse)
def get_history(
    q: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(TranslationHistory)
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            (TranslationHistory.source_text.ilike(search_term)) |
            (TranslationHistory.translated_text.ilike(search_term))
        )

    total = query.count()
    items = query.order_by(TranslationHistory.created_at.desc()).offset(offset).limit(limit).all()

    response_items = [
        TranslationResponse(
            id=item.id,
            source_text=item.source_text,
            translated_text=item.translated_text,
            source_lang=item.source_lang,
            target_lang=item.target_lang,
            provider=item.provider,
            char_count=item.char_count,
            created_at=item.created_at
        )
        for item in items
    ]

    return TranslationHistoryResponse(items=response_items, total=total)

@router.delete("/history")
def clear_history(item_id: Optional[int] = None, db: Session = Depends(get_db)):
    if item_id:
        record = db.query(TranslationHistory).filter(TranslationHistory.id == item_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Translation history record not found")
        db.delete(record)
        db.commit()
        return {"status": "success", "message": f"Record {item_id} deleted"}
    else:
        db.query(TranslationHistory).delete()
        db.commit()
        return {"status": "success", "message": "Translation history cleared"}
