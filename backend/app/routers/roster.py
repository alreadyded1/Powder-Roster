import csv
import io
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.user import User, UserRole
from ..models.shift import Shift
from ..models.shift_assignment import ShiftAssignment, AssignmentStatus
from ..models.season import Season
from ..auth.dependencies import require_manager

router = APIRouter(prefix="/roster", tags=["roster"])


def _user_shifts(db: Session, user_id: int, season_id: int) -> list:
    rows = (
        db.query(ShiftAssignment, Shift)
        .join(Shift, Shift.id == ShiftAssignment.shift_id)
        .filter(
            ShiftAssignment.user_id == user_id,
            ShiftAssignment.status == AssignmentStatus.confirmed,
            Shift.season_id == season_id,
        )
        .order_by(Shift.date, Shift.start_time)
        .all()
    )
    return [
        {
            "shift_id": s.id,
            "title": s.title,
            "date": str(s.date),
            "start_time": str(s.start_time)[:5],
            "end_time": str(s.end_time)[:5],
            "location": s.location,
            "status": a.status,
        }
        for a, s in rows
    ]


@router.get("/summary")
def get_summary(
    season_id: int = Query(...),
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    today = date.today()

    active_volunteers = (
        db.query(func.count(User.id))
        .filter(User.is_active == True, User.role == UserRole.volunteer)
        .scalar()
    )

    shifts = db.query(Shift).filter(Shift.season_id == season_id).all()

    if not shifts:
        return {
            "active_volunteers": active_volunteers,
            "open_shifts": 0,
            "fill_rate": 0.0,
            "upcoming_shifts": 0,
            "total_shifts": 0,
        }

    # Batch-load confirmed counts for all shifts in one query
    counts = dict(
        db.query(ShiftAssignment.shift_id, func.count(ShiftAssignment.id))
        .filter(
            ShiftAssignment.shift_id.in_([s.id for s in shifts]),
            ShiftAssignment.status == AssignmentStatus.confirmed,
        )
        .group_by(ShiftAssignment.shift_id)
        .all()
    )

    total_slots = sum(s.volunteers_needed for s in shifts)
    total_filled = sum(counts.get(s.id, 0) for s in shifts)
    open_shifts = sum(1 for s in shifts if counts.get(s.id, 0) < s.volunteers_needed)
    fill_rate = round(total_filled / total_slots * 100, 1) if total_slots > 0 else 0.0
    upcoming = sum(1 for s in shifts if today <= s.date <= today + timedelta(days=7))

    return {
        "active_volunteers": active_volunteers,
        "open_shifts": open_shifts,
        "fill_rate": fill_rate,
        "upcoming_shifts": upcoming,
        "total_shifts": len(shifts),
    }


@router.get("/export")
def export_roster(
    season_id: int = Query(...),
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    season = db.query(Season).filter(Season.id == season_id).first()
    season_name = season.name.replace(" ", "-").lower() if season else f"season-{season_id}"

    users = (
        db.query(User)
        .filter(User.is_active == True, User.role != UserRole.super_admin)
        .order_by(User.name)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Role", "Confirmed Shifts", "Shift Details"])

    for user in users:
        shifts = _user_shifts(db, user.id, season_id)
        details = "; ".join(
            f"{s['title']} ({s['date']} {s['start_time']}–{s['end_time']})"
            for s in shifts
        )
        writer.writerow([
            user.name,
            user.email,
            user.role.value,
            len(shifts),
            details,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="roster-{season_name}.csv"'},
    )


@router.get("/")
def get_roster(
    season_id: int = Query(...),
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.is_active == True, User.role != UserRole.super_admin)
        .order_by(User.name)
        .all()
    )

    return [
        {
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "confirmed_count": len(shifts := _user_shifts(db, u.id, season_id)),
            "shifts": shifts,
        }
        for u in users
    ]
