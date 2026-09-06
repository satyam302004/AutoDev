def test_list_projects_empty(client):
    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_create_project(client):
    response = client.post(
        "/api/projects",
        json={"idea": "This is a test project idea that is long enough"},
    )
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert "project_id" in data
    assert data["status"] == "pending"


def test_create_project_too_short(client):
    response = client.post(
        "/api/projects",
        json={"idea": "short"},
    )
    assert response.status_code == 422


def test_get_project_not_found(client):
    response = client.get("/api/projects/nonexistent")
    assert response.status_code == 404


def test_delete_project_not_found(client):
    response = client.delete("/api/projects/nonexistent")
    assert response.status_code == 404
