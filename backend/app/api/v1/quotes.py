from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.quote import Quote
from app.models.customer import Customer
from app.schemas.quote import QuoteOut, QuoteItemOut
from app.services.discount import calculate_discount

router = APIRouter()


async def build_quote_out(quote: Quote, db: AsyncSession) -> QuoteOut:
    cust = await db.execute(
        select(Customer).where(Customer.customer_id == quote.customer_id)
    )
    customer = cust.scalar_one_or_none()
    price_tier = customer.price_tier if customer else "standard"

    active_items = [item for item in quote.items if item.status == "active"]

    subtotal = sum(
        float(item.unit_price_try) * item.quantity
        for item in active_items
    )

    discount = await calculate_discount(db, price_tier, active_items)
    total = subtotal * (1 - discount / 100)

    return QuoteOut(
        quote_id=quote.quote_id,
        customer_id=quote.customer_id,
        status=quote.status,
        created_by_channel=quote.created_by_channel,
        currency=quote.currency,
        notes=quote.notes,
        items=[QuoteItemOut.model_validate(item) for item in quote.items],
        subtotal_try=round(subtotal, 2),
        discount_percent=discount,
        total_try=round(total, 2),
    )


@router.get("/quotes/{quote_id}", response_model=QuoteOut)
async def get_quote(
    quote_id: str,
    customer_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quote).where(Quote.quote_id == quote_id)
    )

    quote = result.scalar_one_or_none()

    if not quote:
        raise HTTPException(404, f"Quote {quote_id} not found")

    if customer_id and quote.customer_id != customer_id:
        raise HTTPException(403, "This quote does not belong to this customer")

    return await build_quote_out(quote, db)


@router.get("/quotes", response_model=list[QuoteOut])
async def list_quotes(
    customer_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Quote)

    if customer_id:
        stmt = stmt.where(Quote.customer_id == customer_id)

    result = await db.execute(stmt)
    quotes = result.scalars().all()

    return [
        await build_quote_out(quote, db)
        for quote in quotes
    ]