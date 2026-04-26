import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from api.dependencies.db import get_db
from api.dependencies.auth import require_admin
from api.models.profile import Profile, ProfileSpecialization, Specialization
from api.models.user import User
from api.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut

router = APIRouter()


async def _sync_specializations(db: AsyncSession, profile: Profile, names: list[str]):
    """Replace profile's specializations with the given list, creating new Specialization rows as needed."""
    # Remove existing links
    await db.execute(
        ProfileSpecialization.__table__.delete().where(
            ProfileSpecialization.profile_id == profile.id
        )
    )
    for name in names:
        result = await db.execute(select(Specialization).where(Specialization.name == name))
        spec = result.scalar_one_or_none()
        if spec is None:
            spec = Specialization(name=name)
            db.add(spec)
            await db.flush()
        db.add(ProfileSpecialization(profile_id=profile.id, specialization_id=spec.id))


# ─── Public ───────────────────────────────────────────────────────────────────

@router.get("/profiles", response_model=list[ProfileOut])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Profile)
        .where(Profile.is_active == True)  # noqa: E712
        .options(selectinload(Profile.specializations).selectinload(ProfileSpecialization.specialization))
    )
    return result.scalars().all()


@router.get("/profiles/{profile_id}", response_model=ProfileOut)
async def get_profile(profile_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Profile).where(Profile.id == profile_id)
        .options(selectinload(Profile.specializations).selectinload(ProfileSpecialization.specialization))
    )
    profile = result.scalar_one_or_none()
    if not profile or not profile.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    return profile


# ─── Admin ────────────────────────────────────────────────────────────────────

@router.get("/admin/profiles", response_model=list[ProfileOut])
async def admin_list_profiles(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Profile)
        .options(selectinload(Profile.specializations).selectinload(ProfileSpecialization.specialization))
    )
    return result.scalars().all()


@router.post("/admin/profiles", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
async def create_profile(
    body: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    profile = Profile(**{k: v for k, v in body.model_dump().items() if k != "specialization_names"})
    db.add(profile)
    await db.flush()
    await _sync_specializations(db, profile, body.specialization_names)
    await db.commit()
    await db.refresh(profile)
    result = await db.execute(
        select(Profile).where(Profile.id == profile.id)
        .options(selectinload(Profile.specializations).selectinload(ProfileSpecialization.specialization))
    )
    return result.scalar_one()


@router.patch("/admin/profiles/{profile_id}", response_model=ProfileOut)
async def update_profile(
    profile_id: uuid.UUID,
    body: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")

    update_data = body.model_dump(exclude_unset=True, exclude={"specialization_names"})
    for field, val in update_data.items():
        setattr(profile, field, val)

    if body.specialization_names is not None:
        await _sync_specializations(db, profile, body.specialization_names)

    await db.commit()
    result = await db.execute(
        select(Profile).where(Profile.id == profile_id)
        .options(selectinload(Profile.specializations).selectinload(ProfileSpecialization.specialization))
    )
    return result.scalar_one()


@router.delete("/admin/profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    await db.delete(profile)
    await db.commit()
