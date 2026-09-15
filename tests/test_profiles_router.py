import pytest
from api.models.user import UserRole


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


PROFILE_PAYLOAD = {
    "type": "EXPERT",
    "name_en": "Dr. Test Expert",
    "job_title_en": "Plant Pathologist",
    "specialization_names": ["Rice disease diagnosis", "IPM"],
}


@pytest.mark.asyncio
async def test_list_profiles_public(client):
    resp = await client.get("/profiles")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_profile_404(client):
    resp = await client.get("/profiles/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_profile_requires_admin(client, make_user):
    _, user_token = await make_user(role=UserRole.USER)
    resp = await client.post("/admin/profiles", json=PROFILE_PAYLOAD, headers=_auth(user_token))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_profile_crud_and_specialization_sync(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    headers = _auth(admin_token)

    create_resp = await client.post("/admin/profiles", json=PROFILE_PAYLOAD, headers=headers)
    assert create_resp.status_code == 201
    body = create_resp.json()
    profile_id = body["id"]
    assert sorted(s["name"] for s in body["specializations"]) == ["IPM", "Rice disease diagnosis"]

    # Public list only returns active profiles, and this one is active by default.
    public_list = await client.get("/profiles")
    assert any(p["id"] == profile_id for p in public_list.json())

    # Replace specializations entirely.
    update_resp = await client.patch(
        f"/admin/profiles/{profile_id}",
        json={"specialization_names": ["Soil health"]},
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert [s["name"] for s in update_resp.json()["specializations"]] == ["Soil health"]

    # Deactivate — should disappear from the public list but still be visible to admins.
    deactivate_resp = await client.patch(
        f"/admin/profiles/{profile_id}",
        json={"is_active": False},
        headers=headers,
    )
    assert deactivate_resp.status_code == 200
    public_list_after = await client.get("/profiles")
    assert all(p["id"] != profile_id for p in public_list_after.json())

    delete_resp = await client.delete(f"/admin/profiles/{profile_id}", headers=headers)
    assert delete_resp.status_code == 204


@pytest.mark.asyncio
async def test_reused_specialization_not_duplicated(client, make_user):
    """Two profiles sharing a specialization name should reuse one Specialization row, not conflict."""
    _, admin_token = await make_user(role=UserRole.ADMIN)
    headers = _auth(admin_token)

    payload_a = {**PROFILE_PAYLOAD, "name_en": "Expert A", "specialization_names": ["Shared Spec"]}
    payload_b = {**PROFILE_PAYLOAD, "name_en": "Expert B", "specialization_names": ["Shared Spec"]}

    resp_a = await client.post("/admin/profiles", json=payload_a, headers=headers)
    resp_b = await client.post("/admin/profiles", json=payload_b, headers=headers)
    assert resp_a.status_code == 201
    assert resp_b.status_code == 201
