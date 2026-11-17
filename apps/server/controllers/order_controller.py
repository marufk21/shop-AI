import uuid
from decimal import Decimal

from fastapi import HTTPException, status

from db import OrderRepository
from models import Order, OrderItem, User
from schemas import (
    OrderCreateRequest,
    OrderListResponse,
    OrderResponse,
    OrderUpdateRequest,
)

FREE_SHIPPING_THRESHOLD = Decimal("50.00")
STANDARD_SHIPPING_FEE = Decimal("5.99")


class OrderController:
    def __init__(self, repo: OrderRepository) -> None:
        self.repo = repo

    async def create_order(
        self, payload: OrderCreateRequest, current_user: User
    ) -> OrderResponse:
        unique_ids = list({item.product_id for item in payload.items})
        products = await self.repo.get_products_for_update(unique_ids)
        products_by_id = {product.id: product for product in products}

        if len(products_by_id) != len(unique_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more products could not be found",
            )

        subtotal = Decimal("0.00")
        order_items: list[OrderItem] = []

        for item in payload.items:
            product = products_by_id[item.product_id]
            if product.status != "active":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{product.name} is not available for purchase",
                )
            if item.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid quantity",
                )
            if product.inventory < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient inventory for {product.name}",
                )

            unit_price = Decimal(str(product.price)).quantize(Decimal("0.01"))
            line_total = (unit_price * item.quantity).quantize(Decimal("0.01"))
            subtotal += line_total
            product.inventory -= item.quantity
            order_items.append(
                OrderItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    line_total=line_total,
                    product_name=product.name,
                    product_image_url=product.image_url,
                )
            )

        shipping_fee = (
            Decimal("0.00")
            if subtotal >= FREE_SHIPPING_THRESHOLD
            else STANDARD_SHIPPING_FEE
        )
        total = subtotal + shipping_fee
        shipping_address = payload.shipping_address.model_dump()
        order = await self.repo.create_order(
            user_id=current_user.id,
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            total=total,
            shipping_address=shipping_address,
            items=order_items,
        )
        return self._to_response(order)

    async def list_my_orders(
        self, current_user: User, skip: int, limit: int
    ) -> OrderListResponse:
        orders, total = await self.repo.list_for_user(current_user.id, skip, limit)
        return OrderListResponse(
            items=[self._to_response(order) for order in orders], total=total
        )

    async def list_orders(
        self,
        *,
        status_filter: str | None,
        search: str | None,
        skip: int,
        limit: int,
    ) -> OrderListResponse:
        orders, total = await self.repo.list_all(
            status_filter=status_filter, search=search, skip=skip, limit=limit
        )
        return OrderListResponse(
            items=[self._to_response(order) for order in orders], total=total
        )

    async def get_order(self, order_id: uuid.UUID) -> OrderResponse:
        order = await self.repo.get_by_id_or_none(order_id)
        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
            )
        return self._to_response(order)

    async def update_order(
        self, order_id: uuid.UUID, payload: OrderUpdateRequest
    ) -> OrderResponse:
        order = await self.repo.get_by_id_for_update(order_id)
        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
            )

        updates = payload.model_dump(exclude_unset=True)
        next_status = updates.get("status")
        if order.status == "cancelled" and next_status and next_status != "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A cancelled order cannot be reopened",
            )
        if next_status == "cancelled" and order.status != "cancelled":
            await self.repo.restock_order_items(order)

        updated_order = await self.repo.update(order, updates)
        return self._to_response(updated_order)

    @staticmethod
    def _to_response(order: Order) -> OrderResponse:
        response = OrderResponse.model_validate(order)
        return response.model_copy(
            update={
                "customer_email": order.user.email,
                "customer_name": order.user.username,
            }
        )
