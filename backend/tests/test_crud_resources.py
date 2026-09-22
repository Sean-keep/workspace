"""Generic CRUD coverage for notes / bookmarks / snippets / projects / events."""
from datetime import datetime, timedelta


def _assert_paginated(body):
    assert body["code"] == 200
    data = body["data"]
    assert set(data.keys()) == {"items", "total", "skip", "limit"}
    assert isinstance(data["items"], list)
    assert isinstance(data["total"], int)
    return data


def test_notes_crud_and_excerpt(client, auth_headers):
    long_content = "N" * 500
    created = client.post(
        "/api/notes",
        headers=auth_headers,
        json={"title": "My note", "content": long_content, "tags": ["t1"]},
    )
    assert created.status_code == 200
    note = created.json()["data"]
    assert note["title"] == "My note"
    assert note["content"] == long_content
    note_id = note["id"]

    listed = client.get("/api/notes", headers=auth_headers)
    data = _assert_paginated(listed.json())
    row = next(i for i in data["items"] if i["id"] == note_id)
    # List rows expose excerpt, never the full content field.
    assert "content" not in row
    assert "excerpt" in row
    assert row["excerpt"].startswith("NNNN")
    assert len(row["excerpt"]) <= 161

    updated = client.put(
        f"/api/notes/{note_id}",
        headers=auth_headers,
        json={"title": "Renamed note", "is_favorite": True},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["title"] == "Renamed note"
    assert updated.json()["data"]["is_favorite"] is True

    deleted = client.delete(f"/api/notes/{note_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/notes/{note_id}", headers=auth_headers).status_code == 404


def test_bookmarks_crud(client, auth_headers):
    created = client.post(
        "/api/bookmarks",
        headers=auth_headers,
        json={
            "url": "https://example.com",
            "title": "Example",
            "category": "dev",
            "tags": ["ref"],
        },
    )
    assert created.status_code == 200
    bookmark = created.json()["data"]
    assert bookmark["url"] == "https://example.com"
    assert bookmark["visit_count"] == 0
    bookmark_id = bookmark["id"]

    listed = client.get("/api/bookmarks", headers=auth_headers)
    data = _assert_paginated(listed.json())
    assert any(i["id"] == bookmark_id for i in data["items"])

    updated = client.put(
        f"/api/bookmarks/{bookmark_id}",
        headers=auth_headers,
        json={"title": "Example docs", "visit_count": 5},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["title"] == "Example docs"

    deleted = client.delete(f"/api/bookmarks/{bookmark_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/bookmarks/{bookmark_id}", headers=auth_headers).status_code == 404


def test_snippets_crud(client, auth_headers):
    created = client.post(
        "/api/snippets",
        headers=auth_headers,
        json={
            "title": "hello.py",
            "language": "python",
            "code": "print('hi')",
            "description": "tiny",
        },
    )
    assert created.status_code == 200
    snippet = created.json()["data"]
    assert snippet["language"] == "python"
    snippet_id = snippet["id"]

    listed = client.get("/api/snippets", headers=auth_headers)
    data = _assert_paginated(listed.json())
    assert any(i["id"] == snippet_id for i in data["items"])

    updated = client.put(
        f"/api/snippets/{snippet_id}",
        headers=auth_headers,
        json={"code": "print('bye')", "is_public": True},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["code"] == "print('bye')"
    assert updated.json()["data"]["is_public"] is True

    deleted = client.delete(f"/api/snippets/{snippet_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/snippets/{snippet_id}", headers=auth_headers).status_code == 404


def test_projects_crud_and_progress(client, auth_headers):
    subtasks = [
        {"id": 1, "title": "s1", "status": "done"},
        {"id": 2, "title": "s2", "status": "todo"},
    ]
    created = client.post(
        "/api/projects",
        headers=auth_headers,
        json={
            "name": "Apollo",
            "description": "moon",
            "status": "in_progress",
            "priority": "high",
            "color": "#123456",
            "tags": ["space"],
            "members": 3,
            "subtasks": subtasks,
        },
    )
    assert created.status_code == 200
    project = created.json()["data"]
    assert project["name"] == "Apollo"
    assert project["progress"] == 50  # 1 of 2 subtasks done
    project_id = project["id"]

    listed = client.get("/api/projects", headers=auth_headers)
    data = _assert_paginated(listed.json())
    assert any(i["id"] == project_id for i in data["items"])

    # Progress recomputes when subtasks change.
    updated = client.put(
        f"/api/projects/{project_id}",
        headers=auth_headers,
        json={
            "subtasks": [
                {"id": 1, "title": "s1", "status": "done"},
                {"id": 2, "title": "s2", "status": "done"},
            ]
        },
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["progress"] == 100

    deleted = client.delete(f"/api/projects/{project_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/projects/{project_id}", headers=auth_headers).status_code == 404


def test_events_crud(client, auth_headers):
    start = datetime(2026, 10, 1, 9, 0, 0)
    end = datetime(2026, 10, 1, 10, 0, 0)
    created = client.post(
        "/api/events",
        headers=auth_headers,
        json={
            "title": "Standup",
            "description": "daily sync",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "location": "Room A",
            "is_all_day": False,
            "reminder_minutes": 10,
            "color": "#409EFF",
        },
    )
    assert created.status_code == 200
    event = created.json()["data"]
    assert event["title"] == "Standup"
    event_id = event["id"]

    listed = client.get("/api/events", headers=auth_headers)
    data = _assert_paginated(listed.json())
    assert any(i["id"] == event_id for i in data["items"])

    new_end = end + timedelta(hours=1)
    updated = client.put(
        f"/api/events/{event_id}",
        headers=auth_headers,
        json={"title": "Standup+", "end_time": new_end.isoformat()},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["title"] == "Standup+"

    deleted = client.delete(f"/api/events/{event_id}", headers=auth_headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/events/{event_id}", headers=auth_headers).status_code == 404


def test_dashboard_stats_shape(client, auth_headers):
    """Stats endpoint returns the documented envelope + payload shape."""
    client.post(
        "/api/tasks",
        headers=auth_headers,
        json={"title": "Pending for stats", "status": "todo"},
    )
    resp = client.get("/api/dashboard/stats", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    data = body["data"]
    assert set(data.keys()) >= {"tasks", "events", "notes", "bookmarks", "snippets", "task_trend"}
    assert set(data["tasks"].keys()) == {"total", "completed", "pending", "completion_rate"}
    assert isinstance(data["task_trend"], list)


def test_dashboard_task_trend_counts_completions(client, auth_headers):
    """Completing a task today shows up in the 7-day task_trend.

    dashboard.py groups on func.date(completed_at), which is portable
    across MySQL and SQLite (unlike cast(..., Date)).
    """
    created = client.post(
        "/api/tasks",
        headers=auth_headers,
        json={"title": "Done for trend", "status": "todo"},
    )
    task_id = created.json()["data"]["id"]
    client.put(f"/api/tasks/{task_id}", headers=auth_headers, json={"status": "done"})

    resp = client.get("/api/dashboard/stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    trend = data["task_trend"]
    assert isinstance(trend, list) and len(trend) == 7
    # Today is the last bucket and must count the completion we just made.
    assert trend[-1]["count"] >= 1
    assert data["tasks"]["completed"] >= 1
