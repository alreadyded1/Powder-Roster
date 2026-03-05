from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models.audit_log import AuditLog
from ..models.user import User
from ..auth.dependencies import require_super_admin

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    user_name: str
    action: str
    detail: str | None
    created_at: str

    model_config = {"from_attributes": True}


def _fmt(entry: AuditLog) -> AuditLogResponse:
    return AuditLogResponse(
        id=entry.id,
        user_id=entry.user_id,
        user_name=entry.user_name,
        action=entry.action,
        detail=entry.detail,
        created_at=entry.created_at.isoformat(),
    )


@router.get("/", response_model=List[AuditLogResponse])
def list_audit_log(
    action: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=500),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    if action:
        q = q.filter(AuditLog.action == action)
    return [_fmt(e) for e in q.offset(skip).limit(limit).all()]


@router.get("/actions")
def list_actions(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    rows = db.query(AuditLog.action).distinct().order_by(AuditLog.action).all()
    return [r[0] for r in rows]
