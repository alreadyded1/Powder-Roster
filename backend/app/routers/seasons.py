from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.season import Season
from ..schemas.season import SeasonCreate, SeasonUpdate, SeasonResponse
from ..auth.dependencies import require_manager, get_current_user
from ..models.user import User
from ..services.audit import log_action

router = APIRouter(prefix="/seasons", tags=["seasons"])


@router.get("/", response_model=List[SeasonResponse])
def list_seasons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Season).order_by(Season.start_date.desc()).all()


@router.post("/", response_model=SeasonResponse, status_code=status.HTTP_201_CREATED)
def create_season(
    season_in: SeasonCreate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    if season_in.end_date <= season_in.start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be after start_date",
        )
    season = Season(
        name=season_in.name,
        start_date=season_in.start_date,
        end_date=season_in.end_date,
        self_signup=season_in.self_signup,
        created_by_id=current_user.id,
    )
    db.add(season)
    log_action(db, current_user, "season.created", season_in.name)
    db.commit()
    db.refresh(season)
    return season


@router.patch("/{season_id}", response_model=SeasonResponse)
def update_season(
    season_id: int,
    season_update: SeasonUpdate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    data = season_update.model_dump(exclude_unset=True)

    start = data.get("start_date", season.start_date)
    end = data.get("end_date", season.end_date)
    if end <= start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be after start_date",
        )

    if data.get("is_active"):
        db.query(Season).filter(Season.id != season_id).update({"is_active": False})

    for field, value in data.items():
        setattr(season, field, value)

    log_action(db, current_user, "season.updated", season.name)
    db.commit()
    db.refresh(season)
    return season


@router.post("/{season_id}/activate", response_model=SeasonResponse)
def activate_season(
    season_id: int,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    db.query(Season).filter(Season.id != season_id).update({"is_active": False})
    season.is_active = True
    log_action(db, current_user, "season.activated", season.name)
    db.commit()
    db.refresh(season)
    return season


@router.post("/{season_id}/deactivate", response_model=SeasonResponse)
def deactivate_season(
    season_id: int,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    season.is_active = False
    log_action(db, current_user, "season.deactivated", season.name)
    db.commit()
    db.refresh(season)
    return season
