from sqlalchemy import String, Integer, Numeric, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    product_id: Mapped[str] = mapped_column(String, primary_key=True)
    sku: Mapped[str] = mapped_column(String, nullable=False)
    name_tr: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    brand: Mapped[str] = mapped_column(String, nullable=False)
    price_try: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    stock_qty: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    min_order_qty: Mapped[int] = mapped_column(Integer, default=1)
    delivery_days: Mapped[int] = mapped_column(Integer, default=2)
    warranty_months: Mapped[int] = mapped_column(Integer, default=24)
    tags: Mapped[dict] = mapped_column(JSONB, default=list)
    aliases: Mapped[dict] = mapped_column(JSONB, default=dict)
    substitute_product_ids: Mapped[dict] = mapped_column(JSONB, default=list)
    notes: Mapped[str] = mapped_column(Text, default="")
