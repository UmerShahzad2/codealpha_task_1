from app.services.nlp_engine import NLPEngine

def test_nlp_preprocessing():
    engine = NLPEngine()
    raw = "What is the Nexus AI Lab platform?"
    cleaned = engine.preprocess_text(raw)
    assert "nexus" in cleaned
    assert "platform" in cleaned

def test_nlp_index_building_and_matching():
    engine = NLPEngine()
    test_faqs = [
        {
            "id": 1,
            "question": "What is Nexus AI Lab?",
            "answer": "Nexus AI Lab is a unified enterprise platform.",
            "category": "General",
            "keywords": "overview features"
        },
        {
            "id": 2,
            "question": "How does VisionTrack object tracking work?",
            "answer": "VisionTrack uses YOLO and centroid tracking.",
            "category": "VisionTrack",
            "keywords": "yolo centroid video"
        }
    ]
    built = engine.build_index(test_faqs)
    assert built is True

    top_faq, score, related, is_fallback = engine.match_question("Tell me about Nexus AI Lab")
    assert top_faq is not None
    assert top_faq["id"] == 1
    assert score > 0.3
    assert is_fallback is False

def test_nlp_low_confidence_fallback():
    engine = NLPEngine()
    test_faqs = [
        {
            "id": 1,
            "question": "What is LinguaFlow?",
            "answer": "LinguaFlow is a translation tool.",
            "category": "LinguaFlow",
            "keywords": "translation"
        }
    ]
    engine.build_index(test_faqs)
    top_faq, score, related, is_fallback = engine.match_question("Quantum astrophysics theorem 12345", threshold=0.6)
    assert is_fallback is True
