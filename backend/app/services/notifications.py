from datetime import datetime
from sqlalchemy.orm import Session
from ..models.notification import Notification, NotificationType
from ..models.user import User, UserRole


def create_notification(
    db: Session,
    user_id: int,
    type: NotificationType,
    title: str,
    body: str,
    shift_id: int | None = None,
) -> Notification:
    n = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        shift_id=shift_id,
        created_at=datetime.utcnow(),
    )
    db.add(n)
    return n


def notify_managers(
    db: Session,
    type: NotificationType,
    title: str,
    body: str,
    shift_id: int | None = None,
    exclude_user_id: int | None = None,
):
    """Create a notification for every active manager and super_admin."""
    managers = (
        db.query(User)
        .filter(
            User.is_active == True,
            User.role.in_([UserRole.manager, UserRole.super_admin]),
        )
        .all()
    )
    for mgr in managers:
        if mgr.id == exclude_user_id:
            continue
        create_notification(db, mgr.id, type, title, body, shift_id=shift_id)
