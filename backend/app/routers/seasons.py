from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.season import Season
from ..schemas.season import SeasonCreate, SeasonUpdate, SeasonResponse
from ..auth.dependencies import require_manager
from ..models.user import User

router = APIRouter(prefix="/seasons", tags=["seasons"])


@router.get("/", response_model=List[SeasonResponse])
def list_seasons(
    current_user: User = Depends(require_manager),
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
        created_by_id=current_user.id,
    )
    db.add(season)
    db.commit()
    db.refresh(season)
    return season


@router.get("/{season_id}", response_model=SeasonResponse)
def get_season(
    season_id: int,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
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

    # Validate dates if both provided or one changes the existing pair
    start = data.get("start_date", season.start_date)
    end = data.get("end_date", season.end_date)
    if end <= start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be after start_date",
        )

    # If activating via patch, enforce single-active constraint
    if data.get("is_active"):
        db.query(Season).filter(Season.id != season_id).update({"is_active": False})

    for field, value in data.items():
        setattr(season, field, value)

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
    db.commit()
    db.refresh(season)
    return season
