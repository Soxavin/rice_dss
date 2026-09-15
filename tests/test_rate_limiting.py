# =============================================================================
# tests/test_rate_limiting.py — verifies the slowapi rate limits added to
# api/main.py actually reject requests once a limit is exceeded.
# -----------------------------------------------------------------------------
# The shared `limiter` (api/limiter.py) keeps counters across the whole test
# process, so other test files hitting the same endpoints could otherwise
# push these tests over the limit before they even start (or vice versa,
# mask a broken limit). limiter.reset() before each test guarantees a clean
# slate regardless of test execution order.
# =============================================================================

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from api.main import app
from api.limiter import limiter


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture(autouse=True)
def _reset_limiter():
    limiter.reset()
    yield
    limiter.reset()


@pytest.mark.asyncio
async def test_questionnaire_rate_limit_returns_429_when_exceeded(client):
    """/questionnaire is limited to 30/minute — the 31st request in a burst should 429."""
    statuses = []
    for _ in range(31):
        resp = await client.post('/questionnaire', json={})
        statuses.append(resp.status_code)

    assert statuses[:30] == [200] * 30
    assert statuses[30] == 429


@pytest.mark.asyncio
async def test_predict_image_rate_limit_returns_429_when_exceeded(client):
    """/predict-image is limited to 10/minute. The limit check runs before the
    model-availability check, so this holds even with no ML model loaded —
    every request here returns something other than 200 (503/422/500), but
    the 11th must specifically be 429, not whatever the no-model status was."""
    fake_image = b'\xff\xd8\xff\xe0' + b'\x00' * 100
    statuses = []
    for _ in range(11):
        resp = await client.post(
            '/predict-image',
            files={'image': ('test.jpg', fake_image, 'image/jpeg')},
        )
        statuses.append(resp.status_code)

    assert 429 not in statuses[:10]
    assert statuses[10] == 429
