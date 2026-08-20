import os
import sys
import json

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database import engine, Base, SessionLocal
from app.models import FAQItem
from app.services.nlp_engine import nlp_engine

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_path = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "nexus_faqs.json")
        if not os.path.exists(seed_path):
            print("Seed JSON file not found.")
            return

        with open(seed_path, "r", encoding="utf-8") as f:
            items = json.load(f)

        db.query(FAQItem).delete()
        for d in items:
            item = FAQItem(
                question=d["question"],
                answer=d["answer"],
                category=d["category"],
                keywords=d.get("keywords", "")
            )
            db.add(item)
        db.commit()
        print(f"Successfully seeded {len(items)} FAQ records.")

        faqs = db.query(FAQItem).all()
        faq_list = [
            {"id": f.id, "question": f.question, "answer": f.answer, "category": f.category, "keywords": f.keywords}
            for f in faqs
        ]
        nlp_engine.build_index(faq_list)
        print("NLP Engine vector matrix successfully reindexed.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
