from fastapi import APIRouter, Depends, Query, status

from controllers.order_controller import OrderController
from core.dependencies import get_order_controller, require_authenticated_user
from models import User
from schemas import OrderCreateRequest, OrderListResponse, OrderResponse

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateRequest,
    current_user: User = Depends(require_authenticated_user),
    controller: OrderController = Depends(get_order_controller),
) -> OrderResponse:
    return await controller.create_order(payload, current_user)


@router.get("/mine", response_model=OrderListResponse)
async def list_my_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_authenticated_user),
    controller: OrderController = Depends(get_order_controller),
) -> OrderListResponse:
    return await controller.list_my_orders(current_user, skip, limit)
