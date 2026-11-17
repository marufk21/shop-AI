import uuid
from decimal import Decimal

from sqlalchemy import Select, String, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Order, OrderItem, Product, User


class OrderRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_products_for_update(
        self, product_ids: list[uuid.UUID]
    ) -> list[Product]:
        result = await self.db.execute(
            select(Product).where(Product.id.in_(product_ids)).with_for_update()
        )
        return list(result.scalars().all())

    async def create_order(
        self,
        *,
        user_id: uuid.UUID,
        subtotal: Decimal,
        shipping_fee: Decimal,
        total: Decimal,
        shipping_address: dict[str, str | None],
        items: list[OrderItem],
    ) -> Order:
        order = Order(
            user_id=user_id,
            status="confirmed",
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            total=total,
            shipping_full_name=shipping_address["full_name"],
            shipping_email=shipping_address["email"],
            shipping_phone=shipping_address["phone"],
            shipping_address_line1=shipping_address["address_line1"],
            shipping_address_line2=shipping_address["address_line2"],
            shipping_city=shipping_address["city"],
            shipping_state=shipping_address["state"],
            shipping_postal_code=shipping_address["postal_code"],
            shipping_country=shipping_address["country"],
            items=items,
        )
        self.db.add(order)
        await self.db.flush()
        return await self.get_by_id(order.id)

    @staticmethod
    def _with_details(query: Select[tuple[Order]]) -> Select[tuple[Order]]:
        return query.options(selectinload(Order.items), selectinload(Order.user))

    async def get_by_id(self, order_id: uuid.UUID) -> Order:
        query = self._with_details(select(Order).where(Order.id == order_id))
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_by_id_or_none(self, order_id: uuid.UUID) -> Order | None:
        query = self._with_details(select(Order).where(Order.id == order_id))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, order_id: uuid.UUID) -> Order | None:
        query = self._with_details(
            select(Order).where(Order.id == order_id).with_for_update()
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_for_user(
        self, user_id: uuid.UUID, skip: int, limit: int
    ) -> tuple[list[Order], int]:
        base = select(Order).where(Order.user_id == user_id)
        count_result = await self.db.execute(
            select(func.count(Order.id)).where(Order.user_id == user_id)
        )
        total = count_result.scalar_one()
        result = await self.db.execute(
            self._with_details(
                base.order_by(Order.created_at.desc()).offset(skip).limit(limit)
            )
        )
        return list(result.scalars().all()), total

    async def list_all(
        self,
        *,
        status_filter: str | None,
        search: str | None,
        skip: int,
        limit: int,
    ) -> tuple[list[Order], int]:
        query = select(Order).join(User)
        count_query = select(func.count(Order.id)).join(User)

        if status_filter:
            query = query.where(Order.status == status_filter)
            count_query = count_query.where(Order.status == status_filter)
        if search and (normalized := search.strip()):
            search_filter = or_(
                User.email.ilike(f"%{normalized}%"),
                User.username.ilike(f"%{normalized}%"),
                Order.shipping_full_name.ilike(f"%{normalized}%"),
                Order.tracking_number.ilike(f"%{normalized}%"),
                Order.id.cast(String).ilike(f"%{normalized}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()
        result = await self.db.execute(
            self._with_details(
                query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
            )
        )
        return list(result.scalars().all()), total

    async def restock_order_items(self, order: Order) -> None:
        product_ids = [item.product_id for item in order.items]
        if not product_ids:
            return
        result = await self.db.execute(
            select(Product).where(Product.id.in_(product_ids)).with_for_update()
        )
        products = {product.id: product for product in result.scalars().all()}
        for item in order.items:
            if product := products.get(item.product_id):
                product.inventory += item.quantity

    async def update(self, order: Order, update_data: dict[str, object]) -> Order:
        for key, value in update_data.items():
            setattr(order, key, value)
        await self.db.flush()
        return await self.get_by_id(order.id)
