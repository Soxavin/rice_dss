import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, Float, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.database import Base
import enum


class ProfileType(str, enum.Enum):
    EXPERT = "EXPERT"
    SUPPLIER = "SUPPLIER"


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    type: Mapped[ProfileType] = mapped_column(SAEnum(ProfileType))
    name_en: Mapped[str] = mapped_column(String(255))
    name_km: Mapped[str | None] = mapped_column(String(255))
    bio_en: Mapped[str | None] = mapped_column(Text)
    bio_km: Mapped[str | None] = mapped_column(Text)
    job_title_en: Mapped[str | None] = mapped_column(String(255))
    job_title_km: Mapped[str | None] = mapped_column(String(255))
    education_en: Mapped[str | None] = mapped_column(Text)
    education_km: Mapped[str | None] = mapped_column(Text)
    experience_years: Mapped[int | None] = mapped_column(Integer)
    rating: Mapped[float | None] = mapped_column(Float)
    review_count: Mapped[int | None] = mapped_column(Integer, default=0)
    location_en: Mapped[str | None] = mapped_column(String(255))
    location_km: Mapped[str | None] = mapped_column(String(255))
    availability_en: Mapped[str | None] = mapped_column(String(255))
    availability_km: Mapped[str | None] = mapped_column(String(255))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(50))
    telegram: Mapped[str | None] = mapped_column(String(100))
    photo_url: Mapped[str | None] = mapped_column(Text)
    languages: Mapped[str | None] = mapped_column(String(255))  # comma-separated
    online: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    specializations: Mapped[list["ProfileSpecialization"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan"
    )


class Specialization(Base):
    __tablename__ = "specializations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True)

    profile_links: Mapped[list["ProfileSpecialization"]] = relationship(back_populates="specialization")


class ProfileSpecialization(Base):
    __tablename__ = "profile_specializations"

    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    specialization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("specializations.id", ondelete="CASCADE"), primary_key=True)

    profile: Mapped["Profile"] = relationship(back_populates="specializations")
    specialization: Mapped["Specialization"] = relationship(back_populates="profile_links")
