from pydantic import BaseModel
from typing import Optional
from datetime import date, time


class ShiftBase(BaseModel):
    title: str
    date: date
    start_time: time
    end_time: time
    location: Optional[str] = None
    volunteers_needed: int = 1
    notes: Optional[str] = None


class ShiftCreate(ShiftBase):
    season_id: int


class ShiftUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    volunteers_needed: Optional[int] = None
    notes: Optional[str] = None


class ShiftResponse(ShiftBase):
    id: int
    season_id: int
    created_by_id: Optional[int]

    model_config = {"from_attributes": True}
