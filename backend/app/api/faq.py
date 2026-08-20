from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import FAQItem
from app.schemas import FAQCreate, FAQUpdate, FAQResponse
from app.services.nlp_engine import nlp_engine

router = APIRouter(prefix="/api/v1/faqs", tags=["FAQ Management"])

def _refresh_nlp_index(db: Session):
    faqs = db.query(FAQItem).all()
    faq_data = [
        {
            "id": f.id,
            "question": f.question,
            "answer": f.answer,
            "category": f.category,
            "keywords": f.keywords
        }
        for f in faqs
    ]
    nlp_engine.build_index(faq_data)

@router.get("", response_model=List[FAQResponse])
def list_faqs(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(FAQItem)
    if category and category.strip():
        query = query.filter(FAQItem.category.ilike(category.strip()))
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (FAQItem.question.ilike(term)) |
            (FAQItem.answer.ilike(term)) |
            (FAQItem.keywords.ilike(term))
        )
    return query.order_by(FAQItem.category.asc(), FAQItem.id.asc()).all()

@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(FAQItem.category).distinct().all()
    return sorted([c[0] for c in categories if c[0]])

@router.post("", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
def create_faq(req: FAQCreate, db: Session = Depends(get_db)):
    existing = db.query(FAQItem).filter(FAQItem.question.ilike(req.question.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An FAQ with this exact question already exists"
        )

    item = FAQItem(
        question=req.question.strip(),
        answer=req.answer.strip(),
        category=req.category.strip(),
        keywords=req.keywords.strip() if req.keywords else None
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    _refresh_nlp_index(db)
    return item

@router.put("/{faq_id}", response_model=FAQResponse)
def update_faq(faq_id: int, req: FAQUpdate, db: Session = Depends(get_db)):
    item = db.query(FAQItem).filter(FAQItem.id == faq_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"FAQ with ID {faq_id} not found")

    if req.question is not None:
        item.question = req.question.strip()
    if req.answer is not None:
        item.answer = req.answer.strip()
    if req.category is not None:
        item.category = req.category.strip()
    if req.keywords is not None:
        item.keywords = req.keywords.strip()

    db.commit()
    db.refresh(item)

    _refresh_nlp_index(db)
    return item

@router.delete("/{faq_id}")
def delete_faq(faq_id: int, db: Session = Depends(get_db)):
    item = db.query(FAQItem).filter(FAQItem.id == faq_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"FAQ with ID {faq_id} not found")

    db.delete(item)
    db.commit()

    _refresh_nlp_index(db)
    return {"status": "success", "message": f"FAQ {faq_id} successfully deleted"}

@router.post("/rebuild-index")
def rebuild_index(db: Session = Depends(get_db)):
    _refresh_nlp_index(db)
    return {
        "status": "success",
        "message": f"NLP vector index successfully rebuilt with {len(nlp_engine.faq_list)} FAQs"
    }
