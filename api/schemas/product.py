import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class ProductBase(BaseModel):
    profile_id: uuid.UUID | None = None
    image_url: str | None = None
    name_en: str
    name_km: str | None = None
    desc_en: str | None = None
    desc_km: str | None = None
    price: str | None = None
    category: str | None = None
    usage_instructions_en: str | None = None
    usage_instructions_km: str | None = None
    nutrients_json: dict[str, Any] | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    profile_id: uuid.UUID | None = None
    image_url: str | None = None
    name_en: str | None = None
    name_km: str | None = None
    desc_en: str | None = None
    desc_km: str | None = None
    price: str | None = None
    category: str | None = None
    usage_instructions_en: str | None = None
    usage_instructions_km: str | None = None
    nutrients_json: dict[str, Any] | None = None


class ProductOut(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
