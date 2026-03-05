from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.shift_assignment import AssignmentStatus


class ShiftAssignmentCreate(BaseModel):
    shift_id: int
    user_id: int
    status: AssignmentStatus = AssignmentStatus.confirmed


class ShiftAssignmentUpdate(BaseModel):
    status: Optional[AssignmentStatus] = None


class ShiftAssignmentResponse(BaseModel):
    id: int
    shift_id: int
    user_id: int
    assigned_by_id: Optional[int]
    assigned_at: datetime
    status: AssignmentStatus

    model_config = {"from_attributes": True}
