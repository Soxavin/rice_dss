import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.dependencies.db import get_db
from api.dependencies.auth import require_admin
from api.models.product import Product
from api.models.user import User
from api.schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter()


# ─── Public endpoints ────────────────────────────────────────────────────────

@router.get("/products", response_model=list[ProductOut], tags=["Products"])
async def list_products(
    profile_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Product).order_by(Product.created_at)
    if profile_id is not None:
        q = q.where(Product.profile_id == profile_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/products/{product_id}", response_model=ProductOut, tags=["Products"])
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ─── Admin endpoints ─────────────────────────────────────────────────────────

@router.get("/admin/products", response_model=list[ProductOut], tags=["Admin"])
async def admin_list_products(
    profile_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(Product).order_by(Product.created_at)
    if profile_id is not None:
        q = q.where(Product.profile_id == profile_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/admin/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED, tags=["Admin"])
async def create_product(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = Product(**body.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/admin/products/{product_id}", response_model=ProductOut, tags=["Admin"])
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/admin/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin"])
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()
