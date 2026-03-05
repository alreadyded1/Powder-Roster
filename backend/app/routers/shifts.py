from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import timedelta
from ..database import get_db
from ..models.shift import Shift
from ..models.shift_assignment import ShiftAssignment, AssignmentStatus
from ..models.season import Season
from ..schemas.shift import ShiftCreate, ShiftUpdate, ShiftWithCount, BulkShiftCreate
from ..auth.dependencies import require_manager
from ..models.user import User

router = APIRouter(prefix="/shifts", tags=["shifts"])


def _with_count(db: Session, shift: Shift) -> dict:
    count = (
        db.query(func.count(ShiftAssignment.id))
        .filter(
            ShiftAssignment.shift_id == shift.id,
            ShiftAssignment.status == AssignmentStatus.confirmed,
        )
        .scalar()
    )
    return {**{c.key: getattr(shift, c.key) for c in shift.__table__.columns}, "assigned_count": count}


@router.post("/bulk", response_model=List[ShiftWithCount], status_code=status.HTTP_201_CREATED)
def bulk_create_shifts(
    bulk: BulkShiftCreate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    if not db.query(Season).filter(Season.id == bulk.season_id).first():
        raise HTTPException(status_code=404, detail="Season not found")
    if bulk.end_date < bulk.start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be on or after start_date",
        )
    if not bulk.days_of_week:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Select at least one day of the week",
        )

    created = []
    current = bulk.start_date
    while current <= bulk.end_date:
        if current.weekday() in bulk.days_of_week:
            shift = Shift(
                season_id=bulk.season_id,
                title=bulk.title,
                date=current,
                start_time=bulk.start_time,
                end_time=bulk.end_time,
                location=bulk.location,
                volunteers_needed=bulk.volunteers_needed,
                notes=bulk.notes,
                created_by_id=current_user.id,
            )
            db.add(shift)
            created.append(shift)
        current += timedelta(days=1)

    if not created:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No matching dates found in the selected range and days.",
        )

    db.commit()
    for s in created:
        db.refresh(s)
    return [{**{c.key: getattr(s, c.key) for c in s.__table__.columns}, "assigned_count": 0} for s in created]


@router.get("/", response_model=List[ShiftWithCount])
def list_shifts(
    season_id: int = Query(...),
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    shifts = (
        db.query(Shift)
        .filter(Shift.season_id == season_id)
        .order_by(Shift.date, Shift.start_time)
        .all()
    )
    return [_with_count(db, s) for s in shifts]


@router.post("/", response_model=ShiftWithCount, status_code=status.HTTP_201_CREATED)
def create_shift(
    shift_in: ShiftCreate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    if not db.query(Season).filter(Season.id == shift_in.season_id).first():
        raise HTTPException(status_code=404, detail="Season not found")
    shift = Shift(**shift_in.model_dump(), created_by_id=current_user.id)
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return {**{c.key: getattr(shift, c.key) for c in shift.__table__.columns}, "assigned_count": 0}


@router.get("/{shift_id}", response_model=ShiftWithCount)
def get_shift(
    shift_id: int,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return _with_count(db, shift)


@router.patch("/{shift_id}", response_model=ShiftWithCount)
def update_shift(
    shift_id: int,
    shift_update: ShiftUpdate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    for field, value in shift_update.model_dump(exclude_unset=True).items():
        setattr(shift, field, value)
    db.commit()
    db.refresh(shift)
    return _with_count(db, shift)


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift(
    shift_id: int,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    confirmed = (
        db.query(func.count(ShiftAssignment.id))
        .filter(
            ShiftAssignment.shift_id == shift_id,
            ShiftAssignment.status == AssignmentStatus.confirmed,
        )
        .scalar()
    )
    if confirmed > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete: {confirmed} confirmed assignment(s). Unassign volunteers first.",
        )
    db.delete(shift)
    db.commit()
