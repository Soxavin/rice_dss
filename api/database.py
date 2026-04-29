import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Fall back to in-memory SQLite when DATABASE_URL is not set (e.g. CI test runs).
# The DSS endpoints never touch the DB, so tests pass without a real Neon connection.
_effective_url = DATABASE_URL or "sqlite+aiosqlite://"
_is_postgres = _effective_url.startswith("postgresql")

engine = create_async_engine(
    _effective_url,
    connect_args={"ssl": "require"} if _is_postgres else {},
    pool_pre_ping=_is_postgres,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass
