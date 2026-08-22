import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from api import (
    ai_routes,
    chat_routes,
    document_routes,
    product_routes,
    store_routes,
    upload_routes,
)
from core.database import Base, engine
from utils.keep_alive import start_keep_alive, stop_keep_alive


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    start_keep_alive()
    yield
    await stop_keep_alive()
    await engine.dispose()


app = FastAPI(title="ShopAI", version="0.1.0", lifespan=lifespan)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://shop-ai-client-lake.vercel.app"
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_routes.router)
app.include_router(product_routes.router)
app.include_router(store_routes.router)
app.include_router(upload_routes.router)
app.include_router(document_routes.router)
app.include_router(chat_routes.router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
