"""Auth API tests: register / login / me / password / refresh / rate limit."""
import uuid

from app.config import settings
from app.utils import rate_limit as rate_limit_mod


def _register(client, username=None):
    username = username or f"auth_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "secret123",
        },
    )
    return resp


def test_register_returns_envelope_and_tokens(client):
    resp = _register(client)
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["msg"] == "success"
    data = body["data"]
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["username"].startswith("auth_")
    assert "password_hash" not in data["user"]


def test_register_duplicate_username_400(client):
    username = f"dup_{uuid.uuid4().hex[:8]}"
    first = _register(client, username)
    assert first.status_code == 200
    second = _register(client, username)
    assert second.status_code == 400
    assert second.json()["code"] == 400


def test_login_ok(client):
    username = f"login_{uuid.uuid4().hex[:8]}"
    assert _register(client, username).status_code == 200
    resp = client.post(
        "/api/auth/login",
        json={"username": username, "password": "secret123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["data"]["access_token"]
    assert body["data"]["user"]["username"] == username


def test_login_bad_password_401(client):
    username = f"bad_{uuid.uuid4().hex[:8]}"
    assert _register(client, username).status_code == 200
    resp = client.post(
        "/api/auth/login",
        json={"username": username, "password": "wrong-pass"},
    )
    assert resp.status_code == 401
    assert resp.json()["code"] == 401


def test_login_rate_limit_429(client, monkeypatch):
    limit = 3
    monkeypatch.setattr(settings, "LOGIN_RATE_LIMIT_MAX", limit)
    monkeypatch.setattr(settings, "LOGIN_RATE_LIMIT_WINDOW", 300)
    rate_limit_mod._memory_store.clear()

    username = f"rl_{uuid.uuid4().hex[:8]}"
    assert _register(client, username).status_code == 200

    for _ in range(limit):
        resp = client.post(
            "/api/auth/login",
            json={"username": username, "password": "wrong-pass"},
        )
        assert resp.status_code == 401

    resp = client.post(
        "/api/auth/login",
        json={"username": username, "password": "secret123"},
    )
    assert resp.status_code == 429
    assert resp.json()["code"] == 429


def test_me_returns_profile(client, auth_headers, user_data):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["data"]["username"] == user_data["user"]["username"]
    assert body["data"]["settings"] == {}


def test_me_put_updates_settings(client, auth_headers):
    resp = client.put(
        "/api/auth/me",
        headers=auth_headers,
        json={"settings": {"theme": "dark", "lang": "zh"}},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["data"]["settings"] == {"theme": "dark", "lang": "zh"}

    again = client.get("/api/auth/me", headers=auth_headers)
    assert again.json()["data"]["settings"]["theme"] == "dark"


def test_password_change_wrong_old_400(client, auth_headers):
    resp = client.put(
        "/api/auth/password",
        headers=auth_headers,
        json={"old_password": "not-the-old", "new_password": "newpass123"},
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == 400


def test_password_change_ok_200(client, auth_headers, user_data):
    resp = client.put(
        "/api/auth/password",
        headers=auth_headers,
        json={"old_password": "secret123", "new_password": "newpass123"},
    )
    assert resp.status_code == 200
    assert resp.json()["code"] == 200

    # New password works, old one no longer does.
    ok = client.post(
        "/api/auth/login",
        json={"username": user_data["user"]["username"], "password": "newpass123"},
    )
    assert ok.status_code == 200
    bad = client.post(
        "/api/auth/login",
        json={"username": user_data["user"]["username"], "password": "secret123"},
    )
    assert bad.status_code == 401


def test_refresh_rotates_tokens(client, user_data):
    # JWTs carry second-granularity iat/exp — wait so the rotated pair differs.
    import time

    time.sleep(1.1)
    resp = client.post(
        "/api/auth/refresh",
        json={"refresh_token": user_data["refresh_token"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 200
    assert body["data"]["access_token"]
    assert body["data"]["refresh_token"]
    assert body["data"]["access_token"] != user_data["access_token"]
    assert body["data"]["refresh_token"] != user_data["refresh_token"]
    # The rotated access token still authenticates.
    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {body['data']['access_token']}"},
    )
    assert me.status_code == 200


def test_refresh_garbage_401(client):
    resp = client.post(
        "/api/auth/refresh",
        json={"refresh_token": "not.a.jwt"},
    )
    assert resp.status_code == 401
    assert resp.json()["code"] == 401
