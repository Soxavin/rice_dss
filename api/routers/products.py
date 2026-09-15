import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.dependencies.db import get_db
from api.dependencies.auth import require_admin
from api.logging_config import get_logger
from api.utils.db_errors import safe_commit
from api.models.product import Product
from api.models.user import User
from api.schemas.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter()
logger = get_logger("api.products")


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
    admin: User = Depends(require_admin),
):
    product = Product(**body.model_dump())
    db.add(product)
    await safe_commit(db)
    await db.refresh(product)
    logger.info("Product created: id=%s name=%s by admin=%s", product.id, product.name_en, admin.id)
    return product


@router.patch("/admin/products/{product_id}", response_model=ProductOut, tags=["Admin"])
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    changed_fields = body.model_dump(exclude_unset=True)
    for field, value in changed_fields.items():
        setattr(product, field, value)
    await safe_commit(db)
    await db.refresh(product)
    logger.info("Product updated: id=%s fields=%s by admin=%s", product.id, list(changed_fields), admin.id)
    return product


@router.delete("/admin/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin"])
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await safe_commit(db)
    logger.info("Product deleted: id=%s by admin=%s", product_id, admin.id)
