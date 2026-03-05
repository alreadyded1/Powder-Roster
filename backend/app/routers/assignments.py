from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db
from ..models.shift import Shift
from ..models.shift_assignment import ShiftAssignment, AssignmentStatus
from ..models.season import Season
from ..models.user import User, UserRole
from ..schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from ..auth.dependencies import require_manager, get_current_user
from ..services.notifications import create_notification, notify_managers
from ..models.notification import NotificationType

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _to_response(a: ShiftAssignment, user: User) -> dict:
    return {
        "id": a.id,
        "shift_id": a.shift_id,
        "user_id": a.user_id,
        "user_name": user.name,
        "user_email": user.email,
        "assigned_by_id": a.assigned_by_id,
        "assigned_at": a.assigned_at,
        "status": a.status,
    }


def _confirmed_count(db: Session, shift_id: int) -> int:
    return (
        db.query(func.count(ShiftAssignment.id))
        .filter(
            ShiftAssignment.shift_id == shift_id,
            ShiftAssignment.status == AssignmentStatus.confirmed,
        )
        .scalar()
    )


def _conflict(db: Session, user_id: int, shift: Shift) -> Optional[Shift]:
    """Return conflicting shift if volunteer has an overlapping confirmed assignment."""
    return (
        db.query(Shift)
        .join(ShiftAssignment, ShiftAssignment.shift_id == Shift.id)
        .filter(
            ShiftAssignment.user_id == user_id,
            ShiftAssignment.status == AssignmentStatus.confirmed,
            Shift.id != shift.id,
            Shift.date == shift.date,
            Shift.start_time < shift.end_time,
            Shift.end_time > shift.start_time,
        )
        .first()
    )


# ── Manager endpoints ──────────────────────────────────────────────────────────

@router.get("/", response_model=List[AssignmentResponse])
def list_assignments(
    shift_id: int = Query(...),
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ShiftAssignment, User)
        .join(User, User.id == ShiftAssignment.user_id)
        .filter(ShiftAssignment.shift_id == shift_id)
        .all()
    )
    return [_to_response(a, u) for a, u in rows]


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def assign_volunteer(
    body: AssignmentCreate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    shift = db.query(Shift).filter(Shift.id == body.shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    volunteer = db.query(User).filter(User.id == body.user_id, User.is_active == True).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    # Duplicate check
    existing = (
        db.query(ShiftAssignment)
        .filter(
            ShiftAssignment.shift_id == body.shift_id,
            ShiftAssignment.user_id == body.user_id,
            ShiftAssignment.status != AssignmentStatus.cancelled,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Volunteer is already assigned to this shift.")

    # Cap enforcement
    if body.status == AssignmentStatus.confirmed:
        if _confirmed_count(db, body.shift_id) >= shift.volunteers_needed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Shift is full ({shift.volunteers_needed}/{shift.volunteers_needed} slots filled).",
            )

    # Conflict detection
    conflict = _conflict(db, body.user_id, shift)
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflict: {volunteer.name} is already assigned to '{conflict.title}' on {conflict.date} which overlaps this shift.",
        )

    assignment = ShiftAssignment(
        shift_id=body.shift_id,
        user_id=body.user_id,
        assigned_by_id=current_user.id,
        status=body.status,
    )
    db.add(assignment)

    # Notify the volunteer
    create_notification(
        db, body.user_id, NotificationType.assigned,
        "You've been assigned to a shift",
        f"You were assigned to '{shift.title}' on {shift.date} by {current_user.name}.",
        shift_id=shift.id,
    )

    db.commit()
    db.refresh(assignment)
    return _to_response(assignment, volunteer)


@router.patch("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    body: AssignmentUpdate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    row = (
        db.query(ShiftAssignment, User)
        .join(User, User.id == ShiftAssignment.user_id)
        .filter(ShiftAssignment.id == assignment_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment, volunteer = row

    # If promoting to confirmed, check cap
    if body.status == AssignmentStatus.confirmed and assignment.status != AssignmentStatus.confirmed:
        shift = db.query(Shift).filter(Shift.id == assignment.shift_id).first()
        if _confirmed_count(db, assignment.shift_id) >= shift.volunteers_needed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Shift is full. Cannot confirm this assignment.",
            )

    assignment.status = body.status
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment, volunteer)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def unassign_volunteer(
    assignment_id: int,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    assignment = db.query(ShiftAssignment).filter(ShiftAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Notify the volunteer before deleting
    volunteer = db.query(User).filter(User.id == assignment.user_id).first()
    shift = db.query(Shift).filter(Shift.id == assignment.shift_id).first()
    if volunteer and shift:
        create_notification(
            db, volunteer.id, NotificationType.unassigned,
            "You've been removed from a shift",
            f"You were removed from '{shift.title}' on {shift.date} by {current_user.name}.",
            shift_id=shift.id,
        )

    db.delete(assignment)
    db.commit()


# ── Volunteer endpoints ────────────────────────────────────────────────────────

@router.get("/my", response_model=List[AssignmentResponse])
def my_assignments(
    season_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ShiftAssignment, User)
        .join(User, User.id == ShiftAssignment.user_id)
        .join(Shift, Shift.id == ShiftAssignment.shift_id)
        .filter(
            ShiftAssignment.user_id == current_user.id,
            Shift.season_id == season_id,
            ShiftAssignment.status != AssignmentStatus.cancelled,
        )
        .all()
    )
    return [_to_response(a, u) for a, u in rows]


@router.post("/signup/{shift_id}", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def self_signup(
    shift_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    season = db.query(Season).filter(Season.id == shift.season_id).first()
    if not season.self_signup:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self-signup is not enabled for this season.",
        )

    existing = (
        db.query(ShiftAssignment)
        .filter(
            ShiftAssignment.shift_id == shift_id,
            ShiftAssignment.user_id == current_user.id,
            ShiftAssignment.status != AssignmentStatus.cancelled,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You are already signed up for this shift.")

    if _confirmed_count(db, shift_id) >= shift.volunteers_needed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This shift is full.")

    conflict = _conflict(db, current_user.id, shift)
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflict: you are already assigned to '{conflict.title}' on {conflict.date} which overlaps this shift.",
        )

    assignment = ShiftAssignment(
        shift_id=shift_id,
        user_id=current_user.id,
        assigned_by_id=current_user.id,
        status=AssignmentStatus.confirmed,
    )
    db.add(assignment)

    # Notify managers
    notify_managers(
        db, NotificationType.self_signed_up,
        "Volunteer signed up for a shift",
        f"{current_user.name} signed up for '{shift.title}' on {shift.date}.",
        shift_id=shift.id,
        exclude_user_id=None,
    )

    db.commit()
    db.refresh(assignment)
    return _to_response(assignment, current_user)


@router.delete("/signup/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def self_withdraw(
    shift_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = (
        db.query(ShiftAssignment)
        .filter(
            ShiftAssignment.shift_id == shift_id,
            ShiftAssignment.user_id == current_user.id,
            ShiftAssignment.status != AssignmentStatus.cancelled,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="No active signup found for this shift.")

    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if shift:
        notify_managers(
            db, NotificationType.self_withdrew,
            "Volunteer withdrew from a shift",
            f"{current_user.name} withdrew from '{shift.title}' on {shift.date}.",
            shift_id=shift.id,
            exclude_user_id=None,
        )

    db.delete(assignment)
    db.commit()
