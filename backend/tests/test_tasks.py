"""Tasks API tests: CRUD, isolation, completion, recurring reset."""
from datetime import datetime, timedelta, timezone

from app.models.task import Task
from app.utils.recurring import should_reset_recurring_task


def _create_task(client, headers, **overrides):
    payload = {
        "title": "Test task",
        "description": "desc",
        "status": "todo",
        "priority": "high",
        "tags": ["a"],
    }
    payload.update(overrides)
    resp = client.post("/api/tasks", headers=headers, json=payload)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["code"] == 200
    return body["data"]


def test_task_crud_happy_path(client, auth_headers):
    created = _create_task(client, auth_headers, title="Buy milk")
    assert created["title"] == "Buy milk"
    assert created["status"] == "todo"
    assert created["priority"] == "high"
    assert created["is_recurring"] is False
    task_id = created["id"]

    got = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert got.status_code == 200
    assert got.json()["data"]["id"] == task_id

    updated = client.put(
        f"/api/tasks/{task_id}",
        headers=auth_headers,
        json={"title": "Buy oat milk", "priority": "low"},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["title"] == "Buy oat milk"
    assert updated.json()["data"]["priority"] == "low"

    deleted = client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert deleted.json()["code"] == 200

    missing = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert missing.status_code == 404


def test_task_list_pagination_envelope(client, auth_headers):
    for i in range(3):
        _create_task(client, auth_headers, title=f"Paginated {i}")

    resp = client.get("/api/tasks", headers=auth_headers, params={"skip": 0, "limit": 2})
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    data = body["data"]
    assert set(data.keys()) == {"items", "total", "skip", "limit"}
    assert data["skip"] == 0
    assert data["limit"] == 2
    assert isinstance(data["items"], list)
    assert len(data["items"]) == 2
    assert data["total"] >= 3


def test_task_user_isolation(client, auth_headers, other_auth_headers):
    created = _create_task(client, auth_headers, title="Private task")
    task_id = created["id"]

    assert client.get(f"/api/tasks/{task_id}", headers=other_auth_headers).status_code == 404
    assert (
        client.put(
            f"/api/tasks/{task_id}",
            headers=other_auth_headers,
            json={"title": "hijack"},
        ).status_code
        == 404
    )
    assert client.delete(f"/api/tasks/{task_id}", headers=other_auth_headers).status_code == 404

    # Owner still sees the original title.
    assert client.get(f"/api/tasks/{task_id}", headers=auth_headers).json()["data"]["title"] == "Private task"


def test_complete_recurring_sets_last_completed(client, auth_headers):
    created = _create_task(
        client,
        auth_headers,
        title="Daily standup",
        is_recurring=True,
        recurrence_type="daily",
    )
    assert created["is_recurring"] is True
    assert created["recurrence_type"] == "daily"
    task_id = created["id"]

    resp = client.post(f"/api/tasks/{task_id}/complete", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["status"] == "done"
    assert data["completed_at"] is not None
    assert data["last_completed"] is not None


def test_complete_non_recurring_400(client, auth_headers):
    created = _create_task(client, auth_headers, title="One-off")
    resp = client.post(f"/api/tasks/{created['id']}/complete", headers=auth_headers)
    assert resp.status_code == 400


def test_update_status_done_sets_completed_at(client, auth_headers):
    created = _create_task(client, auth_headers, title="Finish me")
    assert created["completed_at"] is None

    resp = client.put(
        f"/api/tasks/{created['id']}",
        headers=auth_headers,
        json={"status": "done"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["status"] == "done"
    assert data["completed_at"] is not None


def test_custom_status_allowed(client, auth_headers):
    created = _create_task(client, auth_headers, status="custom_169abc")
    assert created["status"] == "custom_169abc"


def test_recurring_daily_resets_when_listed(client, auth_headers, db, yesterday):
    """A daily task completed yesterday is reset to todo on the next list."""
    created = _create_task(
        client,
        auth_headers,
        title="Reset me",
        is_recurring=True,
        recurrence_type="daily",
        status="done",
    )
    task_id = created["id"]

    # Simulate completion from a previous cycle.
    task = db.get(Task, task_id)
    task.status = "done"
    task.last_completed = yesterday.replace(tzinfo=None)
    task.completed_at = yesterday.replace(tzinfo=None)
    db.commit()

    listed = client.get("/api/tasks", headers=auth_headers)
    assert listed.status_code == 200
    items = listed.json()["data"]["items"]
    row = next(i for i in items if i["id"] == task_id)
    assert row["status"] == "todo"
    assert row["completed_at"] is None
