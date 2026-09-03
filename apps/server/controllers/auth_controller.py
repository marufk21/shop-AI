from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from db import UserRepository
from models import Session, User
from schemas import SignInRequest, SignUpRequest
from utils.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)


class AuthController:
    def __init__(self, repo: UserRepository, session_ttl_seconds: int) -> None:
        self.repo = repo
        self.session_ttl_seconds = session_ttl_seconds

    async def signup(self, payload: SignUpRequest) -> tuple[User, str]:
        normalized_email = payload.email.strip().lower()
        normalized_username = payload.username.strip()
        if payload.password != payload.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Passwords do not match",
            )

        existing_user = await self.repo.get_user_by_email(normalized_email)
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with that email already exists",
            )

        existing_username = await self.repo.get_user_by_username(normalized_username)
        if existing_username is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="That username is already taken",
            )

        user = User(
            email=normalized_email,
            username=normalized_username,
            password_hash=hash_password(payload.password),
            role="customer",
        )
        await self.repo.create_user(user)
        session_token = await self._create_session_for_user(user)
        return user, session_token

    async def signin(self, payload: SignInRequest) -> tuple[User, str]:
        normalized_email = payload.email.strip().lower()
        user = await self.repo.get_user_by_email(normalized_email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        session_token = await self._create_session_for_user(user)
        return user, session_token

    async def get_current_user_from_token(self, token: str | None) -> User | None:
        if not token:
            return None

        now = datetime.now(UTC)
        await self.repo.delete_expired_sessions(now)
        session = await self.repo.get_session_with_user(hash_session_token(token))
        if session is None or session.expires_at <= now:
            if session is not None:
                await self.repo.delete_session_by_hash(session.token_hash)
            return None
        return session.user

    async def signout(self, token: str | None) -> None:
        if not token:
            return
        await self.repo.delete_session_by_hash(hash_session_token(token))

    async def ensure_admin_user(self, email: str, password: str) -> None:
        normalized_email = email.strip().lower()
        user = await self.repo.get_user_by_email(normalized_email)
        if user is None:
            user = User(
                email=normalized_email,
                password_hash=hash_password(password),
                role="admin",
            )
            await self.repo.create_user(user)
            return

        user.role = "admin"
        if not verify_password(password, user.password_hash):
            user.password_hash = hash_password(password)

    async def _create_session_for_user(self, user: User) -> str:
        session_token = generate_session_token()
        expires_at = datetime.now(UTC) + timedelta(seconds=self.session_ttl_seconds)
        session = Session(
            user_id=user.id,
            token_hash=hash_session_token(session_token),
            expires_at=expires_at,
        )
        await self.repo.create_session(session)
        return session_token
