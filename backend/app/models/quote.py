from sqlalchemy import String, Integer, Numeric, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Quote(Base):
    __tablename__ = "quotes"

    quote_id: Mapped[str] = mapped_column(String, primary_key=True)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.customer_id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="draft")
    created_by_channel: Mapped[str] = mapped_column(String, default="mobile")
    currency: Mapped[str] = mapped_column(String, default="TRY")
    notes: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    items: Mapped[list["QuoteItem"]] = relationship(
        "QuoteItem", back_populates="quote", lazy="selectin"
    )


class QuoteItem(Base):
    __tablename__ = "quote_items"

    quote_item_id: Mapped[str] = mapped_column(String, primary_key=True)
    quote_id: Mapped[str] = mapped_column(String, ForeignKey("quotes.quote_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.product_id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_try: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String, default="active")  # active | replaced | removed
    source_message_id: Mapped[str] = mapped_column(String, default="")
    idempotency_key: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    is_backorder: Mapped[bool] = mapped_column(Boolean, default=False)

    quote: Mapped["Quote"] = relationship("Quote", back_populates="items")
