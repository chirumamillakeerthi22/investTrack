from dataclasses import dataclass
from functools import lru_cache
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings


security = HTTPBearer()


@dataclass
class AuthenticatedUser:
    id: UUID
    email: str | None


@lru_cache
def get_jwks_client():
    return jwt.PyJWKClient(
        f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser:
    token = credentials.credentials

    unverified_header = jwt.get_unverified_header(token)
    unverified_payload = jwt.decode(
        token,
        options={"verify_signature": False},
    )

    print("JWT HEADER:", unverified_header)
    print(
        "JWT CLAIMS:",
        {
            "iss": unverified_payload.get("iss"),
            "aud": unverified_payload.get("aud"),
            "sub": unverified_payload.get("sub"),
            "exp": unverified_payload.get("exp"),
        },
    )

    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=settings.supabase_jwt_audience,
            issuer=f"{settings.supabase_url}/auth/v1",
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
            )

        return AuthenticatedUser(
            id=UUID(user_id),
            email=payload.get("email"),
        )

    except (jwt.PyJWTError, ValueError) as exc:
        print("JWT VERIFICATION ERROR:", type(exc).__name__, str(exc))

        raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
    )