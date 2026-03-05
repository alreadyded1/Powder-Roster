import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from ..database import get_db
from ..models.invite_token import InviteToken
from ..models.user import User, UserRole
from ..auth.dependencies import require_manager

router = APIRouter(prefix="/invites", tags=["invites"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

INVITE_EXPIRY_DAYS = 7


class InviteCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.volunteer


class InviteAccept(BaseModel):
    name: str
    password: str


# ── Manager: create invite ─────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_invite(
    body: InviteCreate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.manager and body.role == UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers cannot invite super_admin users.",
        )
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered.",
        )

    # Expire any outstanding invites for this email
    db.query(InviteToken).filter(
        InviteToken.email == body.email,
        InviteToken.used_at == None,  # noqa: E711
    ).update({"used_at": datetime.utcnow()})

    token = str(uuid.uuid4())
    invite = InviteToken(
        token=token,
        email=body.email,
        role=body.role,
        created_by_id=current_user.id,
        expires_at=datetime.utcnow() + timedelta(days=INVITE_EXPIRY_DAYS),
    )
    db.add(invite)
    db.commit()

    return {
        "token": token,
        "email": body.email,
        "role": body.role,
        "expires_at": invite.expires_at,
    }


# ── Public: validate + accept ──────────────────────────────────────────────────

@router.get("/{token}")
def get_invite(token: str, db: Session = Depends(get_db)):
    invite = db.query(InviteToken).filter(InviteToken.token == token).first()
    if not invite or invite.used_at or invite.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This invite link is invalid or has expired.",
        )
    return {"email": invite.email, "role": invite.role}


@router.post("/{token}/accept", status_code=status.HTTP_201_CREATED)
def accept_invite(token: str, body: InviteAccept, db: Session = Depends(get_db)):
    invite = db.query(InviteToken).filter(InviteToken.token == token).first()
    if not invite or invite.used_at or invite.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This invite link is invalid or has expired.",
        )
    if db.query(User).filter(User.email == invite.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered.",
        )
    if not body.name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name cannot be blank.",
        )

    user = User(
        name=body.name.strip(),
        email=invite.email,
        password_hash=pwd_context.hash(body.password),
        role=invite.role,
    )
    db.add(user)
    invite.used_at = datetime.utcnow()
    db.commit()

    return {"message": "Account created. You can now log in."}
