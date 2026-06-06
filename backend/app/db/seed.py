import json
import uuid
from datetime import date
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal

DATA_DIR = Path("/data")


async def _already_seeded(session: AsyncSession) -> bool:
    result = await session.execute(text("SELECT COUNT(*) FROM products"))
    count = result.scalar()
    return count > 0


async def run_seed():
    async with AsyncSessionLocal() as session:
        if await _already_seeded(session):
            return

        # products
        products = json.loads((DATA_DIR / "products.json").read_text())

        for p in products:
            await session.execute(
                text("""
                    INSERT INTO products (
                        product_id, sku, name_tr, category, brand, price_try,
                        stock_qty, active, min_order_qty, delivery_days,
                        warranty_months, tags, aliases,
                        substitute_product_ids, notes
                    )
                    VALUES (
                        :product_id, :sku, :name_tr, :category, :brand, :price_try,
                        :stock_qty, :active, :min_order_qty, :delivery_days,
                        :warranty_months, :tags, :aliases,
                        :substitute_product_ids, :notes
                    )
                    ON CONFLICT (product_id) DO NOTHING
                """),
                {
                    **p,
                    "tags": json.dumps(p["tags"]),
                    "aliases": json.dumps(p["aliases"]),
                    "substitute_product_ids": json.dumps(
                        p["substitute_product_ids"]
                    ),
                },
            )

        # knowledge_entries
        knowledge = json.loads(
            (DATA_DIR / "knowledge_entries.json").read_text()
        )

        for k in knowledge:
            await session.execute(
                text("""
                    INSERT INTO knowledge_entries (
                        knowledge_id, topic, locale, title, body,
                        source, applies_to, effective_from
                    )
                    VALUES (
                        :knowledge_id, :topic, :locale, :title, :body,
                        :source, :applies_to, :effective_from
                    )
                    ON CONFLICT (knowledge_id) DO NOTHING
                """),
                {
                    **k,
                    "applies_to": json.dumps(k["applies_to"]),
                    "effective_from": date.fromisoformat(
                        k["effective_from"]
                    ),
                },
            )

                    # customers
        customers = json.loads((DATA_DIR / "customers.json").read_text())

        for c in customers:
            password = c.get("password")

            if not password:
                raise ValueError(
                    f"Missing password for customer {c.get('customer_id')}"
                )

            if not isinstance(password, str):
                raise ValueError(
                    f"Password must be a string for customer {c.get('customer_id')}"
                )

            if len(password.encode("utf-8")) > 72:
                raise ValueError(
                    f"Password is too long for customer {c.get('customer_id')}. "
                    "bcrypt passwords must be 72 bytes or less."
                )

            customer_data = {
                key: value
                for key, value in c.items()
                if key != "password"
            }

            await session.execute(text("""
                INSERT INTO customers (
                    customer_id, name, password_hash, segment, city, price_tier,
                    credit_limit_try, allow_backorder, default_locale, notes
                )
                VALUES (
                    :customer_id, :name, :password_hash, :segment, :city, :price_tier,
                    :credit_limit_try, :allow_backorder, :default_locale, :notes
                )
                ON CONFLICT (customer_id) DO NOTHING
            """), {
                **customer_data,
                "password_hash": hash_password(password),
            })
        # quotes
        quotes = json.loads((DATA_DIR / "quotes.json").read_text())

        for q in quotes:
            await session.execute(
                text("""
                    INSERT INTO quotes (
                        quote_id, customer_id, status,
                        created_by_channel, currency, notes
                    )
                    VALUES (
                        :quote_id, :customer_id, :status,
                        :created_by_channel, :currency, :notes
                    )
                    ON CONFLICT (quote_id) DO NOTHING
                """),
                q,
            )

              # quote_items
        items = json.loads((DATA_DIR / "quote_items.json").read_text())

        for i in items:
            await session.execute(
                text("""
                    INSERT INTO quote_items (
                        quote_item_id, quote_id, product_id,
                        quantity, unit_price_try, status,
                        source_message_id, idempotency_key,
                        is_backorder
                    )
                    VALUES (
                        :quote_item_id, :quote_id, :product_id,
                        :quantity, :unit_price_try, :status,
                        :source_message_id, :idempotency_key,
                        :is_backorder
                    )
                    ON CONFLICT (quote_item_id) DO NOTHING
                """),
                {
                    **i,
                    "is_backorder": i.get("is_backorder", False),
                },
            )

        await session.commit()

        print("✅ Seed data loaded successfully.")