from fastapi.testclient import TestClient
from app.main import app
from app.services.translation_service import translation_service

client = TestClient(app)

def test_translation_languages_endpoint():
    response = client.get("/api/v1/translate/languages")
    assert response.status_code == 200
    data = response.json()
    assert "en" in data
    assert "es" in data
    assert data["en"] == "English"

def test_translation_service_fallback():
    text = "Hello world"
    translated, src, provider = translation_service.translate(text, source_lang="en", target_lang="es")
    assert translated is not None
    assert len(translated) > 0

def test_translate_api_endpoint():
    payload = {
        "text": "Welcome to Nexus AI Lab",
        "source_lang": "en",
        "target_lang": "es"
    }
    response = client.post("/api/v1/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "translated_text" in data
    assert data["source_lang"] == "en"
    assert data["target_lang"] == "es"
