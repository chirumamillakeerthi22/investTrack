from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import AuthenticatedUser, get_current_user
from app.services.user_service import get_or_create_user


router = APIRouter()


@router.get("/api/auth/me")
def get_authenticated_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return {
        "authenticated": True,
        "user_id": str(current_user.id),
        "email": current_user.email,
    }


@router.get("/api/auth/profile")
def get_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.email:
        raise ValueError("Authenticated user does not have an email.")

    user = get_or_create_user(
        db=db,
        user_id=current_user.id,
        email=current_user.email,
    )

    return {
        "id": str(user.id),
        "email": user.email,
        "created_at": user.created_at.isoformat(),
    }