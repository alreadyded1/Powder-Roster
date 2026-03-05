from pydantic import BaseModel
from typing import Optional
from datetime import date


class SeasonBase(BaseModel):
    name: str
    start_date: date
    end_date: date


class SeasonCreate(SeasonBase):
    self_signup: bool = False


class SeasonUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    self_signup: Optional[bool] = None


class SeasonResponse(SeasonBase):
    id: int
    is_active: bool
    self_signup: bool
    created_by_id: Optional[int]

    model_config = {"from_attributes": True}
