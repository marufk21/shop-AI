import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

OrderStatus = Literal[
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
]


class ShippingAddress(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=320)
    phone: str = Field(min_length=7, max_length=40)
    address_line1: str = Field(min_length=3, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=2, max_length=120)
    state: str = Field(min_length=2, max_length=120)
    postal_code: str = Field(min_length=2, max_length=40)
    country: str = Field(min_length=2, max_length=120)


class OrderCreateItem(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(ge=1, le=999)


class OrderCreateRequest(BaseModel):
    items: list[OrderCreateItem] = Field(min_length=1)
    shipping_address: ShippingAddress


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: float
    line_total: float
    product_name: str | None = None
    product_image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    subtotal: float
    shipping_fee: float
    total: float
    shipping_full_name: str | None = None
    shipping_email: str | None = None
    shipping_phone: str | None = None
    shipping_address_line1: str | None = None
    shipping_address_line2: str | None = None
    shipping_city: str | None = None
    shipping_state: str | None = None
    shipping_postal_code: str | None = None
    shipping_country: str | None = None
    tracking_number: str | None = None
    admin_note: str | None = None
    customer_email: str | None = None
    customer_name: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int


class OrderUpdateRequest(BaseModel):
    status: OrderStatus | None = None
    tracking_number: str | None = Field(default=None, max_length=120)
    admin_note: str | None = Field(default=None, max_length=2000)
