def test_project_activity_not_found(client):
    response = client.get("/api/projects/nonexistent/activity")
    assert response.status_code == 404


def test_project_activity_no_execution(client):
    response = client.get("/api/projects/nonexistent/activity")
    assert response.status_code == 404
