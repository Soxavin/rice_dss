import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from api.dependencies.db import get_db
from api.dependencies.auth import require_admin
from api.models.resource import Resource, ResourceTranslation, ResourceStatus, Category
from api.models.user import User
from api.schemas.resource import ResourceCreate, ResourceUpdate, ResourceOut, CategoryOut

router = APIRouter()


def _is_visible(r: Resource) -> bool:
    """A resource is publicly visible if published, or scheduled and due."""
    if r.status == ResourceStatus.PUBLISHED:
        return True
    if r.status == ResourceStatus.SCHEDULED and r.scheduled_at:
        return r.scheduled_at <= datetime.now(timezone.utc)
    return False


# ─── Public ───────────────────────────────────────────────────────────────────

@router.get("/resources", response_model=list[ResourceOut])
async def list_resources(
    lang: str = Query("en"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resource).options(selectinload(Resource.translations), selectinload(Resource.category))
    )
    resources = result.scalars().all()
    return [r for r in resources if _is_visible(r)]


@router.get("/resources/{resource_id}", response_model=ResourceOut)
async def get_resource(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resource)
        .where(Resource.id == resource_id)
        .options(selectinload(Resource.translations), selectinload(Resource.category))
    )
    resource = result.scalar_one_or_none()
    if not resource or not _is_visible(resource):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found")
    return resource


# ─── Admin ────────────────────────────────────────────────────────────────────

@router.get("/admin/resources", response_model=list[ResourceOut])
async def admin_list_resources(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Resource).options(selectinload(Resource.translations), selectinload(Resource.category))
    )
    return result.scalars().all()


@router.post("/admin/resources", response_model=ResourceOut, status_code=status.HTTP_201_CREATED)
async def create_resource(
    body: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    resource = Resource(
        type=body.type,
        category_id=body.category_id,
        status=body.status,
        thumbnail_url=body.thumbnail_url,
        source=body.source,
        scheduled_at=body.scheduled_at,
        published_at=datetime.now(timezone.utc) if body.status == ResourceStatus.PUBLISHED else None,
    )
    db.add(resource)
    await db.flush()  # get resource.id

    for t in body.translations:
        db.add(ResourceTranslation(
            resource_id=resource.id,
            language=t.language,
            title=t.title,
            description=t.description,
            content=t.content,
        ))

    await db.commit()
    await db.refresh(resource)
    result = await db.execute(
        select(Resource).where(Resource.id == resource.id)
        .options(selectinload(Resource.translations), selectinload(Resource.category))
    )
    return result.scalar_one()


@router.patch("/admin/resources/{resource_id}", response_model=ResourceOut)
async def update_resource(
    resource_id: uuid.UUID,
    body: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Resource).where(Resource.id == resource_id)
        .options(selectinload(Resource.translations), selectinload(Resource.category))
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found")

    for field in ("type", "category_id", "thumbnail_url", "source", "scheduled_at"):
        val = getattr(body, field)
        if val is not None:
            setattr(resource, field, val)

    if body.status is not None:
        resource.status = body.status
        if body.status == ResourceStatus.PUBLISHED and resource.published_at is None:
            resource.published_at = datetime.now(timezone.utc)

    if body.translations is not None:
        for existing in resource.translations:
            await db.delete(existing)
        await db.flush()
        for t in body.translations:
            db.add(ResourceTranslation(
                resource_id=resource.id,
                language=t.language,
                title=t.title,
                description=t.description,
                content=t.content,
            ))

    await db.commit()
    result = await db.execute(
        select(Resource).where(Resource.id == resource_id)
        .options(selectinload(Resource.translations), selectinload(Resource.category))
    )
    return result.scalar_one()


@router.delete("/admin/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found")
    await db.delete(resource)
    await db.commit()


# ─── Categories ───────────────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category))
    return result.scalars().all()


@router.post("/admin/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    name: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = Category(name=name)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat
