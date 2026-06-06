"""
Retrieval service — search_products و get_knowledge_entries

نسخة محسنة:
- لا تبحث عن الجملة الطويلة كاملة.
- تقسّم query إلى كلمات مفيدة.
- تطبق topic مباشرة على knowledge.
- تحافظ على price/stock/category كقواعد صارمة.
"""

import re

from sqlalchemy import Text, cast, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge import KnowledgeEntry
from app.models.product import Product


STOPWORDS = {
    "nedir",
    "ne",
    "mi",
    "mı",
    "mu",
    "mü",
    "ve",
    "veya",
    "için",
    "ile",
    "altında",
    "altı",
    "öner",
    "bul",
    "ara",
    "lütfen",
    "bir",
    "adet",
    "tane",
    "tl",
    "try",
    "max",
    "maksimum",
}


def _tokens(query: str) -> list[str]:
    if not query:
        return []

    words = re.findall(r"[a-zA-ZçğıöşüÇĞİÖŞÜ0-9]+", query.lower())

    cleaned = []
    for word in words:
        if len(word) < 2:
            continue

        if word in STOPWORDS:
            continue

        if word.isdigit():
            continue

        if word not in cleaned:
            cleaned.append(word)

    return cleaned[:8]


async def search_products(
    session: AsyncSession,
    query: str,
    max_price_try: float | None = None,
    in_stock_only: bool = True,
    category: str | None = None,
    required_tags: list[str] | None = None,
    limit: int = 10,
) -> list[Product]:
    stmt = select(Product).where(Product.active == True)

    # السعر قاعدة صارمة
    if max_price_try is not None:
        stmt = stmt.where(Product.price_try <= max_price_try)

    # الستوك قاعدة صارمة افتراضيًا
    if in_stock_only:
        stmt = stmt.where(Product.stock_qty > 0)

    # الكاتيجوري قاعدة صارمة إذا تم اكتشافها
    if category:
        stmt = stmt.where(Product.category == category)

    # التاغز قاعدة مساعدة
    if required_tags:
        for tag in required_tags:
            tag_query = f"%{tag.lower()}%"
            stmt = stmt.where(cast(Product.tags, Text).ilike(tag_query))

    # بحث مرن بالكلمات بدل الجملة الكاملة
    terms = _tokens(query)

    if terms:
        term_filters = []

        for term in terms:
            q = f"%{term}%"
            term_filters.append(Product.name_tr.ilike(q))
            term_filters.append(Product.sku.ilike(q))
            term_filters.append(Product.category.ilike(q))
            term_filters.append(cast(Product.aliases, Text).ilike(q))
            term_filters.append(cast(Product.tags, Text).ilike(q))

        stmt = stmt.where(or_(*term_filters))

    stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    return result.scalars().all()


async def get_knowledge_entries(
    session: AsyncSession,
    query: str,
    topic: str | None = None,
    locale: str = "tr",
    limit: int = 5,
) -> list[KnowledgeEntry]:
    stmt = select(KnowledgeEntry).where(KnowledgeEntry.locale == locale)

    # إذا عندنا topic من chat_service، هو أقوى وأدق من query
    if topic:
        stmt = stmt.where(KnowledgeEntry.topic == topic)
        stmt = stmt.limit(limit)

        result = await session.execute(stmt)
        return result.scalars().all()

    # إذا ما في topic، نبحث بالكلمات لا بالجملة الكاملة
    terms = _tokens(query)

    if terms:
        term_filters = []

        for term in terms:
            q = f"%{term}%"
            term_filters.append(KnowledgeEntry.title.ilike(q))
            term_filters.append(KnowledgeEntry.body.ilike(q))
            term_filters.append(KnowledgeEntry.topic.ilike(q))
            term_filters.append(cast(KnowledgeEntry.applies_to, Text).ilike(q))

        stmt = stmt.where(or_(*term_filters))

    stmt = stmt.limit(limit)

    result = await session.execute(stmt)
    return result.scalars().all()