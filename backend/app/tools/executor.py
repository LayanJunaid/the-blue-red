"""
Tool executor — ينفذ أي tool call ويرجع النتيجة + يسجلها في DB
"""
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product
from app.models.knowledge import KnowledgeEntry
from app.models.quote import Quote, QuoteItem
from app.models.customer import Customer
from app.models.tool_call_log import ToolCallLog
from app.services.retrieval import search_products as _search, get_knowledge_entries as _knowledge
from app.services.discount import calculate_discount


async def _log(
    session: AsyncSession,
    session_id: str,
    sequence: int,
    tool_name: str,
    input_summary: str,
    success: bool,
    error: str | None = None,
    quote_delta: dict | None = None,
):
    log = ToolCallLog(
        session_id=session_id,
        sequence=sequence,
        tool_name=tool_name,
        input_summary=input_summary,
        success=success,
        error_message=error,
        quote_delta=json.dumps(quote_delta) if quote_delta else None,
    )
    session.add(log)
    await session.flush()


async def execute_tool(
    session: AsyncSession,
    session_id: str,
    sequence: int,
    tool_name: str,
    args: dict,
) -> dict:
    try:
        result = await _dispatch(session, tool_name, args)
        await _log(session, session_id, sequence, tool_name, json.dumps(args, ensure_ascii=False)[:500], True, quote_delta=result.get("quote_delta"))
        return result
    except Exception as e:
        await _log(session, session_id, sequence, tool_name, json.dumps(args, ensure_ascii=False)[:500], False, error=str(e))
        return {"error": str(e)}


async def _dispatch(session: AsyncSession, tool_name: str, args: dict) -> dict:
    if tool_name == "search_products":
        return await _exec_search_products(session, args)
    elif tool_name == "get_knowledge_entries":
        return await _exec_get_knowledge(session, args)
    elif tool_name == "get_quote":
        return await _exec_get_quote(session, args)
    elif tool_name == "add_to_quote":
        return await _exec_add_to_quote(session, args)
    elif tool_name == "update_quote_item":
        return await _exec_update_quote_item(session, args)
    elif tool_name == "replace_with_alternative":
        return await _exec_replace_with_alternative(session, args)
    else:
        raise ValueError(f"Unknown tool: {tool_name}")


async def _exec_search_products(session: AsyncSession, args: dict) -> dict:
    filters = args.get("filters", {})
    products = await _search(
        session,
        query=args.get("query", ""),
        max_price_try=filters.get("max_price_try"),
        in_stock_only=filters.get("in_stock_only", True),
        category=filters.get("category"),
        required_tags=filters.get("required_tags", []),
        limit=args.get("limit", 10),
    )
    return {
        "products": [
            {
                "product_id": p.product_id,
                "sku": p.sku,
                "name_tr": p.name_tr,
                "category": p.category,
                "price_try": float(p.price_try),
                "stock_qty": p.stock_qty,
                "substitute_product_ids": p.substitute_product_ids,
            }
            for p in products
        ]
    }


async def _exec_get_knowledge(session: AsyncSession, args: dict) -> dict:
    entries = await _knowledge(
        session,
        query=args.get("query", ""),
        topic=args.get("topic"),
        locale=args.get("locale", "tr"),
        limit=args.get("limit", 5),
    )
    return {
        "entries": [
            {
                "knowledge_id": e.knowledge_id,
                "topic": e.topic,
                "title": e.title,
                "body": e.body,
                "source": e.source,
            }
            for e in entries
        ]
    }


async def _exec_get_quote(session: AsyncSession, args: dict) -> dict:
    quote_id = args["quote_id"]
    result = await session.execute(select(Quote).where(Quote.quote_id == quote_id))
    quote = result.scalar_one_or_none()
    if not quote:
        raise ValueError(f"Quote not found: {quote_id}")

    # جيب الكاستمر لحساب الخصم
    cust_result = await session.execute(select(Customer).where(Customer.customer_id == quote.customer_id))
    customer = cust_result.scalar_one_or_none()
    price_tier = customer.price_tier if customer else "standard"

    active_items = [i for i in quote.items if i.status == "active"]
    subtotal = sum(float(i.unit_price_try) * i.quantity for i in active_items)
    discount = await calculate_discount(session, price_tier, active_items)
    total = subtotal * (1 - discount / 100)

    return {
        "quote": {
            "quote_id": quote.quote_id,
            "customer_id": quote.customer_id,
            "status": quote.status,
            "currency": quote.currency,
            "items": [
                {
                    "quote_item_id": i.quote_item_id,
                    "product_id": i.product_id,
                    "quantity": i.quantity,
                    "unit_price_try": float(i.unit_price_try),
                    "status": i.status,
                    "is_backorder": i.is_backorder,
                }
                for i in quote.items
            ],
            "subtotal_try": round(subtotal, 2),
            "discount_percent": discount,
            "total_try": round(total, 2),
        }
    }


async def _exec_add_to_quote(session: AsyncSession, args: dict) -> dict:
    quote_id = args["quote_id"]
    product_id = args["product_id"]
    quantity = int(args["quantity"])
    idempotency_key = args["idempotency_key"]
    source_message_id = args.get("source_message_id", "")
    allow_backorder = args.get("allow_backorder", False)

    # idempotency check
    existing_key = await session.execute(
        select(QuoteItem).where(QuoteItem.idempotency_key == idempotency_key)
    )
    if existing_key.scalar_one_or_none():
        return {"status": "idempotent_skip", "quote_delta": None}

    # جيب المنتج وتحقق من الستوك
    prod_result = await session.execute(select(Product).where(Product.product_id == product_id))
    product = prod_result.scalar_one_or_none()
    if not product:
        raise ValueError(f"Product not found: {product_id}")

    if product.stock_qty == 0 and not allow_backorder:
        raise ValueError(f"Product {product_id} is out of stock and backorder is not allowed.")

    # تحقق إذا المنتج موجود مسبقاً في الـ quote (active)
    existing_item_result = await session.execute(
        select(QuoteItem).where(
            QuoteItem.quote_id == quote_id,
            QuoteItem.product_id == product_id,
            QuoteItem.status == "active",
        )
    )
    existing_item = existing_item_result.scalar_one_or_none()

    if existing_item:
        # زيادة الكمية بدل إنشاء صف جديد
        existing_item.quantity += quantity
        await session.flush()
        delta = {"action": "quantity_increased", "quote_item_id": existing_item.quote_item_id, "new_quantity": existing_item.quantity}
    else:
        # إنشاء صف جديد
        new_item = QuoteItem(
            quote_item_id=f"QI-{uuid.uuid4().hex[:8].upper()}",
            quote_id=quote_id,
            product_id=product_id,
            quantity=quantity,
            unit_price_try=product.price_try,
            status="active",
            source_message_id=source_message_id,
            idempotency_key=idempotency_key,
            is_backorder=(product.stock_qty == 0),
        )
        session.add(new_item)
        await session.flush()
        delta = {"action": "item_added", "quote_item_id": new_item.quote_item_id, "product_id": product_id, "quantity": quantity}

    await session.commit()
    return {"status": "ok", "quote_delta": delta}


async def _exec_update_quote_item(session: AsyncSession, args: dict) -> dict:
    quote_id = args["quote_id"]
    product_id = args["product_id"]
    quantity = int(args["quantity"])

    result = await session.execute(
        select(QuoteItem).where(
            QuoteItem.quote_id == quote_id,
            QuoteItem.product_id == product_id,
            QuoteItem.status == "active",
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise ValueError(f"Active item not found for product {product_id} in quote {quote_id}")

    if quantity == 0:
        item.status = "removed"
        delta = {"action": "item_removed", "quote_item_id": item.quote_item_id}
    else:
        item.quantity = quantity
        delta = {"action": "quantity_updated", "quote_item_id": item.quote_item_id, "new_quantity": quantity}

    await session.commit()
    return {"status": "ok", "quote_delta": delta}


async def _exec_replace_with_alternative(session: AsyncSession, args: dict) -> dict:
    quote_id = args["quote_id"]
    from_product_id = args["from_product_id"]
    to_product_id = args["to_product_id"]
    idempotency_key = args["idempotency_key"]
    reason = args.get("reason", "")

    # idempotency check
    existing_key = await session.execute(
        select(QuoteItem).where(QuoteItem.idempotency_key == idempotency_key)
    )
    if existing_key.scalar_one_or_none():
        return {"status": "idempotent_skip", "quote_delta": None}

    # جيب الصف القديم
    old_result = await session.execute(
        select(QuoteItem).where(
            QuoteItem.quote_id == quote_id,
            QuoteItem.product_id == from_product_id,
            QuoteItem.status == "active",
        )
    )
    old_item = old_result.scalar_one_or_none()
    if not old_item:
        raise ValueError(f"Active item not found for product {from_product_id} in quote {quote_id}")

    quantity = args.get("quantity") or old_item.quantity

    # جيب المنتج الجديد وتحقق من الستوك
    new_prod_result = await session.execute(select(Product).where(Product.product_id == to_product_id))
    new_product = new_prod_result.scalar_one_or_none()
    if not new_product:
        raise ValueError(f"Alternative product not found: {to_product_id}")
    if new_product.stock_qty == 0:
        raise ValueError(f"Alternative product {to_product_id} is also out of stock.")

    # عمل الاستبدال في transaction
    old_item.status = "replaced"

    new_item = QuoteItem(
        quote_item_id=f"QI-{uuid.uuid4().hex[:8].upper()}",
        quote_id=quote_id,
        product_id=to_product_id,
        quantity=quantity,
        unit_price_try=new_product.price_try,
        status="active",
        source_message_id=f"replace:{from_product_id}",
        idempotency_key=idempotency_key,
    )
    session.add(new_item)
    await session.commit()

    delta = {
        "action": "item_replaced",
        "from_product_id": from_product_id,
        "to_product_id": to_product_id,
        "old_item_id": old_item.quote_item_id,
        "new_item_id": new_item.quote_item_id,
        "reason": reason,
    }
    return {"status": "ok", "quote_delta": delta}
