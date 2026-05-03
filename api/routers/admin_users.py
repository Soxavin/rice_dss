import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.dependencies.db import get_db
from api.dependencies.auth import require_admin
from api.models.user import User, UserRole
from api.schemas.user import UserOut, UserUpdate

router = APIRouter()


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Only SUPER_ADMIN can change roles
    if body.role is not None and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only super admins can change roles")

    # ADMIN cannot modify other ADMINs or SUPER_ADMINs
    if (current_user.role == UserRole.ADMIN
            and target.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot modify admin or super admin accounts")

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(target, field, val)

    await db.commit()
    await db.refresh(target)
    return target
