from pydantic import BaseModel
from typing import Any


class QuoteItemOut(BaseModel):
    quote_item_id: str
    quote_id: str
    product_id: str
    quantity: int
    unit_price_try: float
    status: str
    source_message_id: str
    idempotency_key: str
    is_backorder: bool

    model_config = {"from_attributes": True}


class QuoteOut(BaseModel):
    quote_id: str
    customer_id: str
    status: str
    created_by_channel: str
    currency: str
    notes: str
    items: list[QuoteItemOut] = []
    subtotal_try: float = 0.0
    discount_percent: float = 0.0
    total_try: float = 0.0

    model_config = {"from_attributes": True}
