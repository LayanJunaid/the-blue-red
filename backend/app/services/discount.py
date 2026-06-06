"""
حساب الخصومات بناءً على price_rules
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.price_rule import PriceRule
from app.models.quote import QuoteItem
from app.models.product import Product


async def calculate_discount(
    session: AsyncSession,
    customer_price_tier: str,
    items: list[QuoteItem],
) -> float:
    """
    يرجع نسبة الخصم الأعلى المنطبقة على هذا الـ quote.
    """
    if not items:
        return 0.0

    active_items = [i for i in items if i.status == "active"]
    if not active_items:
        return 0.0

    # جيب كل المنتجات دفعة وحدة
    product_ids = [i.product_id for i in active_items]
    result = await session.execute(
        select(Product).where(Product.product_id.in_(product_ids))
    )
    products = {p.product_id: p for p in result.scalars().all()}

    discount = 0.0

    for item in active_items:
        product = products.get(item.product_id)
        if not product:
            continue

        # RUL-PARTNER-3: partner + category + qty >= 3
        if (
            customer_price_tier == "partner"
            and product.category in ("barcode_scanner", "receipt_printer", "label_printer")
        ):
            category_qty = sum(
                i.quantity for i in active_items
                if products.get(i.product_id)
                and products[i.product_id].category == product.category
            )
            if category_qty >= 3:
                discount = max(discount, 7.0)

        # RUL-ACC-5: accessory + qty >= 5
        if product.category == "accessory":
            acc_qty = sum(i.quantity for i in active_items if products.get(i.product_id) and products[i.product_id].category == "accessory")
            if acc_qty >= 5:
                discount = max(discount, 5.0)

        # RUL-PLUS-QTY: sku ends PLUS + qty >= 4
        if product.sku.endswith("PLUS") and item.quantity >= 4:
            discount = max(discount, 6.0)

    # RUL-SW-BUNDLE: الاثنين PRD-SW-520 و PRD-SW-530 موجودين
    sw_ids = {i.product_id for i in active_items}
    if "PRD-SW-520" in sw_ids and "PRD-SW-530" in sw_ids:
        discount = max(discount, 8.0)

    return discount
