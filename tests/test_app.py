import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data

def test_signup_for_activity():
    response = client.post("/activities/Basketball Team/signup", params={"email": "testuser@mergington.edu"})
    assert response.status_code == 200
    assert "Signed up testuser@mergington.edu for Basketball Team" in response.json()["message"]
    # Try signing up again (should fail)
    response = client.post("/activities/Basketball Team/signup", params={"email": "testuser@mergington.edu"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"

def test_signup_activity_not_found():
    response = client.post("/activities/Nonexistent/signup", params={"email": "someone@mergington.edu"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"

def test_unregister_from_activity():
    # First, sign up
    client.post("/activities/Drama Club/signup", params={"email": "remove@mergington.edu"})
    # Now, unregister
    response = client.post("/activities/Drama Club/unregister", params={"email": "remove@mergington.edu"})
    assert response.status_code == 200
    assert "has been unregistered from Drama Club" in response.json()["message"]
    # Try unregistering again (should fail)
    response = client.post("/activities/Drama Club/unregister", params={"email": "remove@mergington.edu"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"
