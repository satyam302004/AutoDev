def test_get_settings(client):
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "llm_provider" in data
    assert "api_key_set" in data
    assert "base_url" in data
    assert "model_main" in data


def test_update_settings(client):
    response = client.put(
        "/api/settings",
        json={
            "llm_provider": "openai",
            "api_key": "test-api-key-12345",
            "base_url": "https://api.openai.com/v1",
            "model_main": "gpt-4",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["llm_provider"] == "openai"
    assert data["api_key_set"] is True
    assert data["base_url"] == "https://api.openai.com/v1"
    assert data["model_main"] == "gpt-4"


def test_settings_persistence(client):
    # Update settings
    client.put(
        "/api/settings",
        json={
            "llm_provider": "openai",
            "api_key": "test-api-key-12345",
            "base_url": "https://api.openai.com/v1",
            "model_main": "gpt-4",
        },
    )

    # Verify settings persist
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["llm_provider"] == "openai"
    assert data["api_key_set"] is True
    assert data["model_main"] == "gpt-4"
