from fastapi import APIRouter, Depends, status

from controllers.order_controller import OrderController
from core.dependencies import get_order_controller, require_authenticated_user
from models import User
from schemas import OrderCreateRequest, OrderResponse

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateRequest,
    current_user: User = Depends(require_authenticated_user),
    controller: OrderController = Depends(get_order_controller),
) -> OrderResponse:
    return await controller.create_order(payload, current_user)
