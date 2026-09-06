def test_search_memory_empty(client):
    response = client.get("/api/memory/search")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_search_memory_with_query(client):
    response = client.get("/api/memory/search?q=test")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_search_memory_with_type_filter(client):
    response = client.get("/api/memory/search?type=project")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_search_memory_with_agent_filter(client):
    response = client.get("/api/memory/search?agent=project_manager")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
