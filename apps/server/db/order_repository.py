import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Order, OrderItem, Product


class OrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_products_for_update(
        self, product_ids: list[uuid.UUID]
    ) -> list[Product]:
        result = await self.db.execute(
            select(Product)
            .where(Product.id.in_(product_ids))
            .with_for_update()
        )
        return list(result.scalars().all())

    async def create_order(
        self,
        *,
        user_id: uuid.UUID,
        subtotal: Decimal,
        total: Decimal,
        items: list[OrderItem],
    ) -> Order:
        order = Order(
            user_id=user_id,
            status="pending_payment",
            subtotal=subtotal,
            total=total,
            items=items,
        )
        self.db.add(order)
        await self.db.flush()
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order.id)
        )
        return result.scalar_one()
