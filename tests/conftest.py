# =============================================================================
# tests/conftest.py — shared fixtures for router tests
# -----------------------------------------------------------------------------
# Provides an isolated in-memory SQLite DB (shared across a test via
# StaticPool, since aiosqlite's plain in-memory URL otherwise hands out a
# fresh empty DB per connection), overriding api.dependencies.db.get_db so
# router tests never touch the real Neon database.
# =============================================================================

import uuid
from datetime import datetime, timedelta, timezone

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from jose import jwt
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.pool import StaticPool

from api.main import app
from api.database import Base
from api.dependencies.db import get_db
from api.routers.auth import JWT_SECRET, JWT_ALGORITHM
from api.models.user import User, UserRole
# Import every model module so its table is registered on Base.metadata.
from api.models import profile as _profile_models  # noqa: F401
from api.models import product as _product_models  # noqa: F401
from api.models import analysis as _analysis_models  # noqa: F401


@compiles(JSONB, "sqlite")
def _compile_jsonb_as_json_on_sqlite(element, compiler, **kw):
    """analysis_history.result uses Postgres JSONB; SQLite has no such type.

    Registering this compiler rule (scoped to the sqlite dialect only, so
    production Postgres behavior is untouched) lets the in-memory test DB
    create that column as plain JSON instead of failing to compile.
    """
    return "JSON"

test_engine = create_async_engine(
    "sqlite+aiosqlite://",
    poolclass=StaticPool,
)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


async def _override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = _override_get_db


@pytest_asyncio.fixture(autouse=True)
async def _fresh_schema():
    """Recreate all tables before each test so tests never see leftover rows."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


def make_token(firebase_uid: str) -> str:
    """Mint a backend JWT the same way api/routers/auth.py does, for a given firebase_uid."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    return jwt.encode({"sub": firebase_uid, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


@pytest_asyncio.fixture
async def make_user(db_session):
    """Factory fixture: create a seeded User row + a valid bearer token for it."""
    async def _make(role: UserRole = UserRole.USER, is_active: bool = True) -> tuple[User, str]:
        uid = str(uuid.uuid4())
        user = User(
            firebase_uid=uid,
            email=f"{uid}@test.local",
            name="Test User",
            role=role,
            is_active=is_active,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user, make_token(uid)
    return _make
