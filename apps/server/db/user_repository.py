from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Session, User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_user(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        return user

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: object) -> User | None:
        return await self.db.get(User, user_id)

    async def create_session(self, session: Session) -> Session:
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_session_with_user(self, token_hash: str) -> Session | None:
        result = await self.db.execute(
            select(Session)
            .options(selectinload(Session.user))
            .where(Session.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def delete_session_by_hash(self, token_hash: str) -> None:
        await self.db.execute(delete(Session).where(Session.token_hash == token_hash))
        await self.db.flush()

    async def delete_expired_sessions(self, now: datetime) -> None:
        await self.db.execute(delete(Session).where(Session.expires_at <= now))
        await self.db.flush()
