from typing import Literal

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from controllers.auth_controller import AuthController
from core.config import settings
from core.dependencies import get_auth_controller, get_current_user
from models import User
from schemas import AuthResponse, AuthUserResponse, SignInRequest, SignUpRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _cookie_samesite() -> Literal["lax", "none"]:
    """Return 'none' for cross-origin production deployments, 'lax' for local dev."""
    return "none" if settings.secure_cookies else "lax"


def set_auth_cookie(response: Response, session_token: str) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=session_token,
        httponly=True,
        secure=settings.secure_cookies,
        samesite=_cookie_samesite(),
        max_age=settings.session_ttl_seconds,
        expires=settings.session_ttl_seconds,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        secure=settings.secure_cookies,
        samesite=_cookie_samesite(),
        path="/",
    )


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    payload: SignUpRequest,
    response: Response,
    auth_controller: AuthController = Depends(get_auth_controller),
) -> AuthResponse:
    user, session_token = await auth_controller.signup(payload)
    set_auth_cookie(response, session_token)
    return AuthResponse(user=AuthUserResponse.model_validate(user))


@router.post("/signin", response_model=AuthResponse)
async def signin(
    payload: SignInRequest,
    response: Response,
    auth_controller: AuthController = Depends(get_auth_controller),
) -> AuthResponse:
    user, session_token = await auth_controller.signin(payload)
    set_auth_cookie(response, session_token)
    return AuthResponse(user=AuthUserResponse.model_validate(user))


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
async def signout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=settings.auth_cookie_name),
    auth_controller: AuthController = Depends(get_auth_controller),
) -> None:
    await auth_controller.signout(session_token)
    clear_auth_cookie(response)


@router.get("/me", response_model=AuthResponse)
async def me(current_user: User | None = Depends(get_current_user)) -> AuthResponse:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return AuthResponse(user=AuthUserResponse.model_validate(current_user))
