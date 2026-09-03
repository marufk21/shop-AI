import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrderCreateItem(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(ge=1, le=999)


class OrderCreateRequest(BaseModel):
    items: list[OrderCreateItem] = Field(min_length=1)


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: float
    line_total: float

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    subtotal: float
    total: float
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)
