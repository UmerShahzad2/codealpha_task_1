from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chatbot_session_lifecycle():
    response = client.post("/api/v1/chatbot/sessions", json={"title": "Test Session"})
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    session_id = data["id"]

    query_res = client.post("/api/v1/chatbot/query", json={
        "session_id": session_id,
        "message": "What is Nexus AI Lab?"
    })
    assert query_res.status_code == 200
    query_data = query_res.json()
    assert "bot_response" in query_data
    assert "confidence" in query_data

    del_res = client.delete(f"/api/v1/chatbot/sessions/{session_id}")
    assert del_res.status_code == 200
