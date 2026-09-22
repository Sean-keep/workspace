"""Shared fixtures: in-memory SQLite + TestClient with lifespan enabled.

Runs without MySQL/Redis. The engine/SessionLocal used by lifespan
(`_bootstrap_admin`, the recurring loop, /health) is swapped for the test
engine *before* TestClient starts, so no external services are touched.
"""
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Settings are built at import time — set test values first.
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = "admin-test-pass"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["DB_HOST"] = "127.0.0.1"
os.environ["REDIS_HOST"] = "127.0.0.1"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

test_engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# main.py binds `engine` / `SessionLocal` at import time — patch both namespaces.
import app.database as database_module
import app.main as main_module

database_module.engine = test_engine
database_module.SessionLocal = TestingSessionLocal
main_module.engine = test_engine
main_module.SessionLocal = TestingSessionLocal


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db

# Never touch Redis in tests; use the in-process limiter fallback.
from app.utils import rate_limit as rate_limit_mod

rate_limit_mod._redis_checked = True
rate_limit_mod._redis_client = None
rate_limit_mod._memory_store.clear()


@pytest.fixture(scope="session")
def client():
    Base.metadata.create_all(bind=test_engine)
    # Context manager so lifespan runs (admin bootstrap + recurring loop).
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _clear_rate_limit():
    rate_limit_mod._memory_store.clear()
    yield
    rate_limit_mod._memory_store.clear()


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _unique_name(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def register_user(client, prefix="user"):
    """Register a fresh user; returns the payload `data` dict (user + tokens)."""
    username = _unique_name(prefix)
    resp = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "secret123",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["code"] == 200
    return body["data"]


def auth_headers_for(data: dict) -> dict:
    return {"Authorization": f"Bearer {data['access_token']}"}


@pytest.fixture
def user_data(client):
    return register_user(client, "user")


@pytest.fixture
def auth_headers(user_data):
    return auth_headers_for(user_data)


@pytest.fixture
def other_user_data(client):
    return register_user(client, "other")


@pytest.fixture
def other_auth_headers(other_user_data):
    return auth_headers_for(other_user_data)


@pytest.fixture
def utcnow():
    return datetime.now(timezone.utc)


@pytest.fixture
def yesterday(utcnow):
    return utcnow - timedelta(days=1)
