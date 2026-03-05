from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, timedelta
from pydantic import BaseModel
from ..database import get_db
from ..models.notification import Notification, NotificationType
from ..models.shift import Shift
from ..models.shift_assignment import ShiftAssignment, AssignmentStatus
from ..auth.dependencies import get_current_user, require_manager
from ..models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):
    id: int
    type: NotificationType
    title: str
    body: str
    is_read: bool
    shift_id: int | None
    created_at: str

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    count: int


class AlertShift(BaseModel):
    id: int
    title: str
    date: str
    start_time: str
    location: str | None
    volunteers_needed: int
    assigned_count: int
    days_until: int


def _to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id,
        type=n.type,
        title=n.title,
        body=n.body,
        is_read=n.is_read,
        shift_id=n.shift_id,
        created_at=n.created_at.isoformat(),
    )


@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = Query(default=50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_to_response(n) for n in rows]


@router.get("/count", response_model=UnreadCountResponse)
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .scalar()
    )
    return {"count": count}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return _to_response(n)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == True
    ).delete()
    db.commit()


@router.get("/alerts", response_model=List[AlertShift])
def upcoming_unfilled_alerts(
    season_id: int = Query(...),
    days_ahead: int = Query(default=7, le=30),
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """Shifts in the next N days that still need volunteers."""
    today = date.today()
    cutoff = today + timedelta(days=days_ahead)

    shifts = (
        db.query(Shift)
        .filter(
            Shift.season_id == season_id,
            Shift.date >= today,
            Shift.date <= cutoff,
        )
        .order_by(Shift.date, Shift.start_time)
        .all()
    )

    alerts = []
    for shift in shifts:
        confirmed = (
            db.query(func.count(ShiftAssignment.id))
            .filter(
                ShiftAssignment.shift_id == shift.id,
                ShiftAssignment.status == AssignmentStatus.confirmed,
            )
            .scalar()
        )
        if confirmed < shift.volunteers_needed:
            alerts.append(
                AlertShift(
                    id=shift.id,
                    title=shift.title,
                    date=shift.date.isoformat(),
                    start_time=str(shift.start_time),
                    location=shift.location,
                    volunteers_needed=shift.volunteers_needed,
                    assigned_count=confirmed,
                    days_until=(shift.date - today).days,
                )
            )
    return alerts
