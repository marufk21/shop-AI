import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.product_model import Product
    from models.user_model import User


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(40), nullable=False, default="confirmed", index=True
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    shipping_fee: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    shipping_full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    shipping_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    shipping_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    shipping_address_line1: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    shipping_address_line2: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    shipping_city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    shipping_state: Mapped[str | None] = mapped_column(String(120), nullable=True)
    shipping_postal_code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    shipping_country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    admin_note: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    # Product details are captured when the order is placed so order history stays
    # meaningful even if a catalog item is later renamed or removed.
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()

    __table_args__ = (
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_product_id", "product_id"),
    )
