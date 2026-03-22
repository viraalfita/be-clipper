from fastapi.testclient import TestClient

from app.main import app


def test_analyze_endpoint_invalid_youtube_url() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/jobs/analyze",
        json={
            "mode": "auto_detect",
            "youtube_url": "https://example.com/video",
            "clip_count": 5,
            "duration_target": 20,
        },
    )

    assert response.status_code == 422
