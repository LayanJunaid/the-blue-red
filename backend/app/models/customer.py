from sqlalchemy import String, Boolean, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Customer(Base):
    __tablename__ = "customers"

    customer_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    segment: Mapped[str] = mapped_column(String, default="retail")
    city: Mapped[str] = mapped_column(String, default="")
    price_tier: Mapped[str] = mapped_column(String, default="standard")
    credit_limit_try: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    allow_backorder: Mapped[bool] = mapped_column(Boolean, default=False)
    default_locale: Mapped[str] = mapped_column(String, default="tr")
    notes: Mapped[str] = mapped_column(Text, default="")