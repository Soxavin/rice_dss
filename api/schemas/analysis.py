import uuid
from datetime import datetime
from pydantic import BaseModel
from api.models.analysis import AnalysisMode


class AnalysisCreate(BaseModel):
    mode: AnalysisMode
    result: dict  # full DSSResponse JSON blob
    confidence: float | None = None
    image_url: str | None = None


class AnalysisOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    mode: AnalysisMode
    result: dict
    confidence: float | None
    image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
