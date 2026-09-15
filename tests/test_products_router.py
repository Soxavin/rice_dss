import pytest
from api.models.user import UserRole


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


PRODUCT_PAYLOAD = {
    "name_en": "Vigor TestGrow",
    "name_km": "TestGrow",
    "desc_en": "A test product.",
    "category": "Yield Booster",
    "price": "$10.00",
}


@pytest.mark.asyncio
async def test_list_products_public(client):
    resp = await client.get("/products")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_product_404(client):
    resp = await client.get("/products/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_product_requires_admin(client, make_user):
    _, user_token = await make_user(role=UserRole.USER)
    resp = await client.post("/admin/products", json=PRODUCT_PAYLOAD, headers=_auth(user_token))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_product_no_token_rejected(client):
    resp = await client.post("/admin/products", json=PRODUCT_PAYLOAD)
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_admin_product_crud_lifecycle(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    headers = _auth(admin_token)

    create_resp = await client.post("/admin/products", json=PRODUCT_PAYLOAD, headers=headers)
    assert create_resp.status_code == 201
    product_id = create_resp.json()["id"]

    get_resp = await client.get(f"/products/{product_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name_en"] == "Vigor TestGrow"

    update_resp = await client.patch(
        f"/admin/products/{product_id}",
        json={"price": "$15.00"},
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["price"] == "$15.00"

    delete_resp = await client.delete(f"/admin/products/{product_id}", headers=headers)
    assert delete_resp.status_code == 204

    missing_resp = await client.get(f"/products/{product_id}")
    assert missing_resp.status_code == 404


@pytest.mark.asyncio
async def test_update_missing_product_404(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    resp = await client.patch(
        "/admin/products/00000000-0000-0000-0000-000000000000",
        json={"price": "$1.00"},
        headers=_auth(admin_token),
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_missing_product_404(client, make_user):
    _, admin_token = await make_user(role=UserRole.ADMIN)
    resp = await client.delete(
        "/admin/products/00000000-0000-0000-0000-000000000000",
        headers=_auth(admin_token),
    )
    assert resp.status_code == 404
