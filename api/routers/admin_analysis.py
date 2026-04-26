import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.dependencies.db import get_db
from api.dependencies.auth import get_current_user, require_admin
from api.models.analysis import AnalysisHistory, AnalysisMode
from api.models.user import User
from api.schemas.analysis import AnalysisCreate, AnalysisOut

router = APIRouter()


# ─── User endpoint: save own analysis ─────────────────────────────────────────

@router.post("/analyses", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
async def save_analysis(
    body: AnalysisCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = AnalysisHistory(
        user_id=current_user.id,
        mode=body.mode,
        result=body.result,
        confidence=body.confidence,
        image_url=body.image_url,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/analyses", response_model=list[AnalysisOut])
async def get_my_analyses(
    limit: int = Query(15, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AnalysisHistory)
        .where(AnalysisHistory.user_id == current_user.id)
        .order_by(AnalysisHistory.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AnalysisHistory).where(
            AnalysisHistory.id == analysis_id,
            AnalysisHistory.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Analysis not found")
    await db.delete(record)
    await db.commit()


@router.delete("/analyses", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import delete as sql_delete
    await db.execute(
        sql_delete(AnalysisHistory).where(AnalysisHistory.user_id == current_user.id)
    )
    await db.commit()


# ─── Admin endpoints ──────────────────────────────────────────────────────────

@router.get("/analysis", response_model=list[AnalysisOut])
async def admin_list_analyses(
    limit: int = Query(50, le=200),
    mode: AnalysisMode | None = Query(None),
    from_date: datetime | None = Query(None),
    to_date: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(AnalysisHistory).order_by(AnalysisHistory.created_at.desc()).limit(limit)
    if mode:
        q = q.where(AnalysisHistory.mode == mode)
    if from_date:
        q = q.where(AnalysisHistory.created_at >= from_date)
    if to_date:
        q = q.where(AnalysisHistory.created_at <= to_date)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/analysis/{analysis_id}", response_model=AnalysisOut)
async def admin_get_analysis(
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(AnalysisHistory).where(AnalysisHistory.id == analysis_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Analysis not found")
    return record
