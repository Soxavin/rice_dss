from unittest.mock import patch

import pytest
from api.routers import auth as auth_router
from api.models.user import User, UserRole


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_exchange_creates_new_user(client):
    with patch.object(
        auth_router.firebase_auth, "verify_id_token",
        return_value={"uid": "new-firebase-uid", "email": "new@test.local", "name": "New User"},
    ):
        resp = await client.post("/auth/me", headers=_auth("fake-firebase-id-token"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


@pytest.mark.asyncio
async def test_exchange_reuses_existing_user(client, db_session):
    user = User(firebase_uid="existing-uid", email="existing@test.local", name="Existing", role=UserRole.USER)
    db_session.add(user)
    await db_session.commit()

    with patch.object(
        auth_router.firebase_auth, "verify_id_token",
        return_value={"uid": "existing-uid", "email": "existing@test.local", "name": "Existing"},
    ):
        resp = await client.post("/auth/me", headers=_auth("fake-token"))
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_exchange_rejects_deactivated_user(client, db_session):
    user = User(firebase_uid="deactivated-uid", email="deactivated@test.local", role=UserRole.USER, is_active=False)
    db_session.add(user)
    await db_session.commit()

    with patch.object(
        auth_router.firebase_auth, "verify_id_token",
        return_value={"uid": "deactivated-uid", "email": "deactivated@test.local"},
    ):
        resp = await client.post("/auth/me", headers=_auth("fake-token"))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_exchange_rejects_invalid_firebase_token(client):
    with patch.object(auth_router.firebase_auth, "verify_id_token", side_effect=Exception("bad token")):
        resp = await client.post("/auth/me", headers=_auth("garbage"))
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_valid_token(client, make_user):
    user, token = await make_user(role=UserRole.USER)
    resp = await client.get("/auth/me", headers=_auth(token))
    assert resp.status_code == 200
    assert resp.json()["id"] == str(user.id)


@pytest.mark.asyncio
async def test_get_me_invalid_token(client):
    resp = await client.get("/auth/me", headers=_auth("not-a-real-jwt"))
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_no_token(client):
    resp = await client.get("/auth/me")
    assert resp.status_code in (401, 403)
