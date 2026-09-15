import pytest
from api.models.user import UserRole


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_users_requires_admin(client, make_user):
    _, user_token = await make_user(role=UserRole.USER)
    resp = await client.get("/admin/users", headers=_auth(user_token))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_users_no_token_rejected(client):
    resp = await client.get("/admin/users")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_users_as_admin(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    resp = await client.get("/admin/users", headers=_auth(admin_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_user_404(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    resp = await client.get(
        "/admin/users/00000000-0000-0000-0000-000000000000",
        headers=_auth(admin_token),
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cannot_modify_own_account(client, make_user):
    admin, admin_token = await make_user(role=UserRole.ADMIN)
    resp = await client.patch(
        f"/admin/users/{admin.id}",
        json={"name": "New Name"},
        headers=_auth(admin_token),
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_only_super_admin_can_change_roles(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    target, _ = await make_user(role=UserRole.USER)

    resp = await client.patch(
        f"/admin/users/{target.id}",
        json={"role": "ADMIN"},
        headers=_auth(admin_token),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_super_admin_can_change_roles(client, make_user):
    _, super_admin_token = await make_user(role=UserRole.SUPER_ADMIN)
    target, _ = await make_user(role=UserRole.USER)

    resp = await client.patch(
        f"/admin/users/{target.id}",
        json={"role": "ADMIN"},
        headers=_auth(super_admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_admin_cannot_modify_other_admin_accounts(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    other_admin, _ = await make_user(role=UserRole.ADMIN)

    resp = await client.patch(
        f"/admin/users/{other_admin.id}",
        json={"name": "Renamed"},
        headers=_auth(admin_token),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_cannot_modify_super_admin_accounts(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    super_admin, _ = await make_user(role=UserRole.SUPER_ADMIN)

    resp = await client.patch(
        f"/admin/users/{super_admin.id}",
        json={"name": "Renamed"},
        headers=_auth(admin_token),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_modify_regular_user(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    target, _ = await make_user(role=UserRole.USER)

    resp = await client.patch(
        f"/admin/users/{target.id}",
        json={"name": "Updated Name"},
        headers=_auth(admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_super_admin_can_modify_admin_account(client, make_user):
    _, super_admin_token = await make_user(role=UserRole.SUPER_ADMIN)
    target_admin, _ = await make_user(role=UserRole.ADMIN)

    resp = await client.patch(
        f"/admin/users/{target_admin.id}",
        json={"is_active": False},
        headers=_auth(super_admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False
