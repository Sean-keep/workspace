"""Unit tests for utils.security — password hashing and JWT type enforcement."""
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_verify_roundtrip():
    hashed = get_password_hash("s3cret-pw")
    assert hashed != "s3cret-pw"
    assert hashed.startswith("$2")
    assert verify_password("s3cret-pw", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_verify_password_rejects_garbage_hash():
    assert verify_password("anything", "not-a-bcrypt-hash") is False


def test_access_token_decodes_as_access():
    token = create_access_token({"user_id": 7, "username": "u"})
    payload = decode_token(token, expected_type="access")
    assert payload is not None
    assert payload["user_id"] == 7
    assert payload["type"] == "access"


def test_refresh_token_rejected_as_access():
    token = create_refresh_token({"user_id": 7, "username": "u"})
    # Presenting a refresh token where an access token is expected must fail.
    assert decode_token(token, expected_type="access") is None
    assert decode_token(token, expected_type="refresh") is not None


def test_access_token_rejected_as_refresh():
    token = create_access_token({"user_id": 7, "username": "u"})
    assert decode_token(token, expected_type="refresh") is None


def test_decode_token_rejects_garbage():
    assert decode_token("not.a.token", expected_type="access") is None
    assert decode_token("", expected_type="refresh") is None
