from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_or_create_user(
    db: Session,
    user_id: UUID,
    email: str,
) -> User:
    user = db.get(User, user_id)

    if user is not None:
        return user

    user = User(
        id=user_id,
        email=email,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user