import os
from datetime import datetime, timedelta, timezone

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.dependencies.db import get_db
from api.models.user import User, UserRole
from api.schemas.user import TokenResponse, UserOut

router = APIRouter()

JWT_SECRET      = os.getenv("JWT_SECRET", "change-me")
JWT_ALGORITHM   = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MIN  = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

# Initialise Firebase Admin SDK once (idempotent)
if not firebase_admin._apps:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    cred = credentials.Certificate(cred_path) if cred_path else credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

bearer = HTTPBearer()


def _issue_jwt(firebase_uid: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN)
    return jwt.encode({"sub": firebase_uid, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/me", response_model=TokenResponse)
async def exchange_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
):
    """Exchange a Firebase ID token for a backend JWT. Creates the user row if needed."""
    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Firebase token")

    firebase_uid = decoded["uid"]
    email        = decoded.get("email", "")
    name         = decoded.get("name")

    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        user = User(firebase_uid=firebase_uid, email=email, name=name, role=UserRole.USER)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")

    return TokenResponse(access_token=_issue_jwt(firebase_uid))


@router.get("/me", response_model=UserOut)
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user's profile."""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        firebase_uid: str = payload.get("sub")
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user
