import uuid

from fastapi import APIRouter, Depends, Query

from controllers.order_controller import OrderController
from core.dependencies import get_order_controller, require_admin_user
from models import User
from schemas import OrderListResponse, OrderResponse, OrderUpdateRequest

router = APIRouter(prefix="/api/v1/admin/orders", tags=["admin-orders"])


@router.get("", response_model=OrderListResponse)
async def list_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    _: User = Depends(require_admin_user),
    controller: OrderController = Depends(get_order_controller),
) -> OrderListResponse:
    return await controller.list_orders(
        status_filter=status_filter, search=search, skip=skip, limit=limit
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    _: User = Depends(require_admin_user),
    controller: OrderController = Depends(get_order_controller),
) -> OrderResponse:
    return await controller.get_order(order_id)


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: uuid.UUID,
    payload: OrderUpdateRequest,
    _: User = Depends(require_admin_user),
    controller: OrderController = Depends(get_order_controller),
) -> OrderResponse:
    return await controller.update_order(order_id, payload)
