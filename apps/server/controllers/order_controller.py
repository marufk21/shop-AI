from decimal import Decimal

from fastapi import HTTPException, status

from db import OrderRepository
from models import OrderItem, User
from schemas import OrderCreateRequest, OrderResponse


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
                )
            )

        total = subtotal
        order = await self.repo.create_order(
            user_id=current_user.id,
            subtotal=subtotal,
            total=total,
            items=order_items,
        )
        return OrderResponse.model_validate(order)
