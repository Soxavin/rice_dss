import uuid
from datetime import datetime
from pydantic import BaseModel
from api.models.resource import ResourceType, ResourceStatus, Language


class TranslationIn(BaseModel):
    language: Language
    title: str
    description: str | None = None
    content: str | None = None  # HTML from TipTap


class TranslationOut(TranslationIn):
    id: uuid.UUID
    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    model_config = {"from_attributes": True}


class ResourceCreate(BaseModel):
    type: ResourceType = ResourceType.ARTICLE
    category_id: uuid.UUID | None = None
    status: ResourceStatus = ResourceStatus.DRAFT
    thumbnail_url: str | None = None
    source: str | None = None
    scheduled_at: datetime | None = None
    translations: list[TranslationIn]  # at minimum one EN translation required


class ResourceUpdate(BaseModel):
    type: ResourceType | None = None
    category_id: uuid.UUID | None = None
    status: ResourceStatus | None = None
    thumbnail_url: str | None = None
    source: str | None = None
    scheduled_at: datetime | None = None
    translations: list[TranslationIn] | None = None


class ResourceOut(BaseModel):
    id: uuid.UUID
    type: ResourceType
    status: ResourceStatus
    thumbnail_url: str | None
    source: str | None
    scheduled_at: datetime | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    category: CategoryOut | None
    translations: list[TranslationOut]

    model_config = {"from_attributes": True}
