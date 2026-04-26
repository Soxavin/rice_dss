import uuid
from datetime import datetime
from pydantic import BaseModel
from api.models.profile import ProfileType


class SpecializationOut(BaseModel):
    id: uuid.UUID
    name: str
    model_config = {"from_attributes": True}


class ProfileBase(BaseModel):
    type: ProfileType
    name_en: str
    name_km: str | None = None
    bio_en: str | None = None
    bio_km: str | None = None
    job_title_en: str | None = None
    job_title_km: str | None = None
    education_en: str | None = None
    education_km: str | None = None
    experience_years: int | None = None
    rating: float | None = None
    review_count: int | None = None
    location_en: str | None = None
    location_km: str | None = None
    availability_en: str | None = None
    availability_km: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    telegram: str | None = None
    photo_url: str | None = None
    languages: str | None = None
    online: bool = False
    is_active: bool = True
    specialization_names: list[str] = []


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    name_en: str | None = None
    name_km: str | None = None
    bio_en: str | None = None
    bio_km: str | None = None
    job_title_en: str | None = None
    job_title_km: str | None = None
    education_en: str | None = None
    education_km: str | None = None
    experience_years: int | None = None
    rating: float | None = None
    review_count: int | None = None
    location_en: str | None = None
    location_km: str | None = None
    availability_en: str | None = None
    availability_km: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    telegram: str | None = None
    photo_url: str | None = None
    languages: str | None = None
    online: bool | None = None
    is_active: bool | None = None
    specialization_names: list[str] | None = None


class ProfileOut(BaseModel):
    id: uuid.UUID
    type: ProfileType
    name_en: str
    name_km: str | None
    bio_en: str | None
    bio_km: str | None
    job_title_en: str | None
    job_title_km: str | None
    education_en: str | None
    education_km: str | None
    experience_years: int | None
    rating: float | None
    review_count: int | None
    location_en: str | None
    location_km: str | None
    availability_en: str | None
    availability_km: str | None
    contact_email: str | None
    contact_phone: str | None
    telegram: str | None
    photo_url: str | None
    languages: str | None
    online: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    specializations: list[SpecializationOut] = []

    model_config = {"from_attributes": True}
