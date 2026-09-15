from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession


async def safe_commit(db: AsyncSession, conflict_detail: str = "A conflicting record already exists.") -> None:
    """Commit and translate DB errors into clean HTTP responses instead of raw 500s.

    IntegrityError (unique/FK constraint violations) -> 409, everything else -> 500.
    Always rolls back on failure so the session stays usable.
    """
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, conflict_detail)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error.")
