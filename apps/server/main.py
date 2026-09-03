import asyncio
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from api import (
    ai_routes,
    auth_routes,
    chat_routes,
    document_routes,
    order_routes,
    product_routes,
    store_chat_routes,
    store_routes,
    upload_routes,
)
from controllers.auth_controller import AuthController
from core.config import settings
from core.database import Base, engine
from db.user_repository import UserRepository
from utils.keep_alive import start_keep_alive, stop_keep_alive

DB_STARTUP_RETRIES = 3
DB_RETRY_DELAY_SECONDS = 5


async def init_database() -> None:
    """Run startup DB setup, retrying on transient network/DNS failures."""
    for attempt in range(1, DB_STARTUP_RETRIES + 1):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                await conn.run_sync(Base.metadata.create_all)
                # Idempotent schema additions for already-existing tables created
                # before the `username` column existed (no migration framework here;
                # `create_all` does not ALTER existing tables).
                await conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
                        "username VARCHAR(50)"
                    )
                )
                await conn.execute(
                    text(
                        "CREATE UNIQUE INDEX IF NOT EXISTS "
                        "ix_users_username ON users (username)"
                    )
                )
            return
        except (SQLAlchemyError, OSError) as exc:
            if attempt == DB_STARTUP_RETRIES:
                raise
            print(
                f"WARNING: database startup attempt {attempt}/{DB_STARTUP_RETRIES} "
                f"failed ({exc}); retrying in {DB_RETRY_DELAY_SECONDS}s..."
            )
            await asyncio.sleep(DB_RETRY_DELAY_SECONDS)



@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_database()
    if settings.admin_email and settings.admin_password:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            auth_controller = AuthController(
                UserRepository(session),
                session_ttl_seconds=settings.session_ttl_seconds,
            )
            await auth_controller.ensure_admin_user(
                settings.admin_email, settings.admin_password
            )
            await session.commit()
    start_keep_alive()
    yield
    await stop_keep_alive()
    await engine.dispose()


app = FastAPI(title="ShopAI", version="0.1.0", lifespan=lifespan)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://shop-ai-client-lake.vercel.app"
]
frontend_url = settings.frontend_url or os.getenv("FRONTEND_URL")
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_routes.router)
app.include_router(auth_routes.router)
app.include_router(order_routes.router)
app.include_router(product_routes.router)
app.include_router(store_routes.router)
app.include_router(store_chat_routes.router)
app.include_router(upload_routes.router)
app.include_router(document_routes.router)
app.include_router(chat_routes.router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
