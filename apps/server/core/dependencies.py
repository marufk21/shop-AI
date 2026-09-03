from collections.abc import AsyncGenerator

from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from controllers import ChatController, DocumentController
from controllers.admin.product_controller import AdminProductController
from controllers.auth_controller import AuthController
from controllers.order_controller import OrderController
from controllers.store.product_controller import StoreProductController
from core.config import settings
from core.database import get_db
from db import (
    DocumentRepository,
    OrderRepository,
    ProductRepository,
    UserRepository,
    VectorRepository,
)
from models import User
from utils.cloudinary import CloudinaryUploader


def get_cloudinary_uploader() -> CloudinaryUploader:
    return CloudinaryUploader()


async def get_product_repository(
    db: AsyncSession = Depends(get_db),
) -> AsyncGenerator[ProductRepository, None]:
    yield ProductRepository(db)


async def get_user_repository(
    db: AsyncSession = Depends(get_db),
) -> AsyncGenerator[UserRepository, None]:
    yield UserRepository(db)


async def get_order_repository(
    db: AsyncSession = Depends(get_db),
) -> AsyncGenerator[OrderRepository, None]:
    yield OrderRepository(db)


async def get_auth_controller(
    repo: UserRepository = Depends(get_user_repository),
) -> AsyncGenerator[AuthController, None]:
    yield AuthController(repo, session_ttl_seconds=settings.session_ttl_seconds)


async def get_order_controller(
    repo: OrderRepository = Depends(get_order_repository),
) -> AsyncGenerator[OrderController, None]:
    yield OrderController(repo)


async def get_admin_product_controller(
    repo: ProductRepository = Depends(get_product_repository),
    uploader: CloudinaryUploader = Depends(get_cloudinary_uploader),
) -> AsyncGenerator[AdminProductController, None]:
    yield AdminProductController(repo, uploader)


async def get_store_product_controller(
    repo: ProductRepository = Depends(get_product_repository),
) -> AsyncGenerator[StoreProductController, None]:
    yield StoreProductController(repo)


async def get_document_repository(
    db: AsyncSession = Depends(get_db),
) -> AsyncGenerator[DocumentRepository, None]:
    yield DocumentRepository(db)


async def get_vector_repository(
    db: AsyncSession = Depends(get_db),
) -> AsyncGenerator[VectorRepository, None]:
    yield VectorRepository(db)


async def get_document_controller(
    doc_repo: DocumentRepository = Depends(get_document_repository),
    vector_repo: VectorRepository = Depends(get_vector_repository),
) -> AsyncGenerator[DocumentController, None]:
    yield DocumentController(doc_repo, vector_repo)


async def get_chat_controller(
    db: AsyncSession = Depends(get_db),
) -> AsyncGenerator[ChatController, None]:
    yield ChatController(db)


async def get_current_user(
    session_token: str | None = Cookie(default=None, alias=settings.auth_cookie_name),
    authorization: str | None = Header(default=None),
    auth_controller: AuthController = Depends(get_auth_controller),
) -> User | None:
    token = session_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
    return await auth_controller.get_current_user_from_token(token)


async def require_authenticated_user(
    current_user: User | None = Depends(get_current_user),
) -> User:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return current_user


async def require_admin_user(
    current_user: User = Depends(require_authenticated_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
