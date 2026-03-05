from datetime import datetime
from sqlalchemy.orm import Session
from ..models.audit_log import AuditLog
from ..models.user import User


def log_action(db: Session, user: User, action: str, detail: str | None = None) -> None:
    """Append an audit entry to the session. Caller's commit will persist it."""
    db.add(AuditLog(
        user_id=user.id,
        user_name=user.name,
        action=action,
        detail=detail,
        created_at=datetime.utcnow(),
    ))
