from pydantic import BaseModel
from typing import Any


class ProductOut(BaseModel):
    product_id: str
    sku: str
    name_tr: str
    category: str
    brand: str
    price_try: float
    stock_qty: int
    active: bool
    min_order_qty: int
    delivery_days: int
    warranty_months: int
    tags: Any
    aliases: Any
    substitute_product_ids: Any
    notes: str

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    product_id: str
    sku: str
    name_tr: str
    category: str
    brand: str
    price_try: float
    stock_qty: int = 0
    active: bool = True
    min_order_qty: int = 1
    delivery_days: int = 2
    warranty_months: int = 24
    tags: Any = []
    aliases: Any = {}
    substitute_product_ids: Any = []
    notes: str = ""
