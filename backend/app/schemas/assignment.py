from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.shift_assignment import AssignmentStatus


class AssignmentCreate(BaseModel):
    shift_id: int
    user_id: int
    status: AssignmentStatus = AssignmentStatus.confirmed


class AssignmentUpdate(BaseModel):
    status: AssignmentStatus


class AssignmentResponse(BaseModel):
    id: int
    shift_id: int
    user_id: int
    user_name: str
    user_email: str
    assigned_by_id: Optional[int]
    assigned_at: datetime
    status: AssignmentStatus

    model_config = {"from_attributes": False}
