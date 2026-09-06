def test_health_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["app"] == "AutoDev"
    assert body["llm_provider"] in {"gemini", "openai", "ollama"}
    assert "llm_configured" in body


def test_health_returns_request_id(client):
    response = client.get("/api/health")
    assert response.headers.get("X-Request-ID")


def test_health_returns_process_time(client):
    response = client.get("/api/health")
    assert response.headers.get("X-Process-Time")


def test_cors_preflight_allows_dashboard_origin(client):
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["app"] == "AutoDev"
    assert body["docs"] == "/docs"


def test_openapi_docs_available(client):
    response = client.get("/docs")
    assert response.status_code == 200
