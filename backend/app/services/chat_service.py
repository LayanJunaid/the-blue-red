"""
Chat service — LLM orchestration + deterministic fallback mode.
"""

import json
import re
import uuid
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.tools.executor import execute_tool

EVT_START = "message_start"
EVT_TOOL_START = "tool_start"
EVT_TOOL_RESULT = "tool_result"
EVT_SOURCE = "sources"
EVT_TEXT = "text_chunk"
EVT_DONE = "done"
EVT_ERROR = "error"


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def chat_stream(
    session: AsyncSession,
    session_id: str,
    quote_id: str,
    customer_id: str,
    message: str,
) -> AsyncGenerator[str, None]:
    yield _sse(EVT_START, {"session_id": session_id, "quote_id": quote_id})

    try:
        if settings.llm_enabled:
            async for chunk in _llm_flow(
                session=session,
                session_id=session_id,
                quote_id=quote_id,
                customer_id=customer_id,
                message=message,
            ):
                yield chunk
        else:
            async for chunk in _fallback_flow(
                session=session,
                session_id=session_id,
                quote_id=quote_id,
                customer_id=customer_id,
                message=message,
            ):
                yield chunk

    except Exception as exc:
        yield _sse(EVT_ERROR, {"message": str(exc)})
        yield _sse(EVT_DONE, {"session_id": session_id})


async def _llm_flow(
    session: AsyncSession,
    session_id: str,
    quote_id: str,
    customer_id: str,
    message: str,
) -> AsyncGenerator[str, None]:
    from openai import AsyncOpenAI
    from app.tools.registry import TOOLS

    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,
    )

    system_prompt = f"""
You are The Blue Red AI Sales Assistant.

Current quote: {quote_id}
Current customer: {customer_id}

Language Rules:
- Reply in the same language used by the customer.
- If the customer writes Arabic, reply in Arabic.
- If the customer writes Turkish, reply in Turkish.
- If the customer writes English, reply in English.

Tool Rules:
- Product search/recommendation/price/stock: use search_products.
- Policies/warranty/delivery/returns/discounts/compatibility: use get_knowledge_entries.
- Quote status/details/totals: use get_quote.
- Add product: use add_to_quote.
- Quantity change: use update_quote_item.
- Replacement/alternative: use replace_with_alternative.

Business Rules:
- Price limit is absolute.
- Never recommend or add products above the user price limit.
- Never add stock_qty = 0 unless user clearly accepts waiting/backorder.
- Never invent prices, stock, warranty, or policies.
- Use only tool results.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message},
    ]

    sequence = 0
    sources = []

    while True:
        stream = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            stream=True,
        )

        assistant_text = ""
        tool_calls_buffer = {}

        async for chunk in stream:
            delta = chunk.choices[0].delta

            if delta.content:
                assistant_text += delta.content
                yield _sse(EVT_TEXT, {"text": delta.content})

            if delta.tool_calls:
                for tool_call_delta in delta.tool_calls:
                    index = tool_call_delta.index

                    if index not in tool_calls_buffer:
                        tool_calls_buffer[index] = {
                            "id": "",
                            "name": "",
                            "arguments": "",
                        }

                    if tool_call_delta.id:
                        tool_calls_buffer[index]["id"] = tool_call_delta.id

                    if tool_call_delta.function:
                        if tool_call_delta.function.name:
                            tool_calls_buffer[index]["name"] += tool_call_delta.function.name

                        if tool_call_delta.function.arguments:
                            tool_calls_buffer[index]["arguments"] += tool_call_delta.function.arguments

        if tool_calls_buffer:
            assistant_message = {
                "role": "assistant",
                "content": assistant_text or None,
                "tool_calls": [],
            }

            tool_results = []

            for index in sorted(tool_calls_buffer.keys()):
                buffered = tool_calls_buffer[index]
                tool_name = buffered["name"]

                try:
                    args = json.loads(buffered["arguments"] or "{}")
                except json.JSONDecodeError:
                    args = {}

                tool_call_id = buffered["id"] or f"call_{uuid.uuid4().hex}"

                assistant_message["tool_calls"].append({
                    "id": tool_call_id,
                    "type": "function",
                    "function": {
                        "name": tool_name,
                        "arguments": json.dumps(args, ensure_ascii=False),
                    },
                })

                sequence += 1

                yield _sse(
                    EVT_TOOL_START,
                    {
                        "tool": tool_name,
                        "input_summary": str(args)[:200],
                        "sequence": sequence,
                    },
                )

                result = await execute_tool(
                    session=session,
                    session_id=session_id,
                    sequence=sequence,
                    tool_name=tool_name,
                    args=args,
                )

                if tool_name == "search_products":
                    sources += [
                        product["product_id"]
                        for product in result.get("products", [])
                    ]

                if tool_name == "get_knowledge_entries":
                    sources += [
                        entry["knowledge_id"]
                        for entry in result.get("entries", [])
                    ]

                yield _sse(
                    EVT_TOOL_RESULT,
                    {
                        "tool": tool_name,
                        "sequence": sequence,
                        "success": "error" not in result,
                        "quote_delta": result.get("quote_delta"),
                    },
                )

                tool_results.append({
                    "tool_call_id": tool_call_id,
                    "role": "tool",
                    "content": json.dumps(result, ensure_ascii=False),
                })

            messages.append(assistant_message)
            messages.extend(tool_results)
            continue

        if sources:
            yield _sse(EVT_SOURCE, {"source_ids": sorted(set(sources))})

        yield _sse(EVT_DONE, {"session_id": session_id})
        break
    
async def _fallback_flow(
    session: AsyncSession,
    session_id: str,
    quote_id: str,
    customer_id: str,
    message: str,
) -> AsyncGenerator[str, None]:
    sequence = 0
    sources = []
    quote_delta = None

    msg = message.lower()

    wants_policy = _is_policy_question(msg)
    wants_product = _is_product_question(msg)
    wants_add = _is_add_request(msg)
    wants_update = _is_update_request(msg)
    wants_replace = _is_replace_request(msg)

    max_price = _extract_max_price_try(msg)
    quantity = _extract_quantity(msg)

    sequence += 1
    yield _sse(
        EVT_TOOL_START,
        {
            "tool": "get_quote",
            "input_summary": quote_id,
            "sequence": sequence,
        },
    )

    quote_result = await execute_tool(
        session=session,
        session_id=session_id,
        sequence=sequence,
        tool_name="get_quote",
        args={"quote_id": quote_id},
    )

    yield _sse(
        EVT_TOOL_RESULT,
        {
            "tool": "get_quote",
            "sequence": sequence,
            "success": "error" not in quote_result,
            "quote_delta": None,
        },
    )

    quote = quote_result.get("quote", {})

    entries = []
    if wants_policy:
        sequence += 1
        yield _sse(
            EVT_TOOL_START,
            {
                "tool": "get_knowledge_entries",
                "input_summary": message[:120],
                "sequence": sequence,
            },
        )

        knowledge_result = await execute_tool(
            session=session,
            session_id=session_id,
            sequence=sequence,
            tool_name="get_knowledge_entries",
            args={
                "query": _expand_query(message),
                "locale": "tr",
                "topic": _detect_topic(msg),
                "limit": 3,
            },
        )

        entries = knowledge_result.get("entries", [])
        sources += [entry["knowledge_id"] for entry in entries]

        yield _sse(
            EVT_TOOL_RESULT,
            {
                "tool": "get_knowledge_entries",
                "sequence": sequence,
                "success": "error" not in knowledge_result,
                "quote_delta": None,
            },
        )

    products = []
    if wants_product or wants_add or wants_replace:
        sequence += 1
        yield _sse(
            EVT_TOOL_START,
            {
                "tool": "search_products",
                "input_summary": message[:120],
                "sequence": sequence,
            },
        )

        product_result = await execute_tool(
            session=session,
            session_id=session_id,
            sequence=sequence,
            tool_name="search_products",
            args={
                "query": _expand_query(message),
                "locale": "tr",
                "filters": {
                    "category": _detect_category(msg),
                    "max_price_try": max_price,
                    "in_stock_only": True,
                    "required_tags": _detect_tags(msg),
                },
                "limit": 5,
            },
        )

        products = product_result.get("products", [])
        sources += [product["product_id"] for product in products]

        yield _sse(
            EVT_TOOL_RESULT,
            {
                "tool": "search_products",
                "sequence": sequence,
                "success": "error" not in product_result,
                "quote_delta": None,
            },
        )

    if wants_add and products:
        selected = products[0]
        sequence += 1

        idempotency_key = _make_idempotency_key(
            session_id,
            message,
            "add_to_quote",
            selected["product_id"],
        )

        yield _sse(
            EVT_TOOL_START,
            {
                "tool": "add_to_quote",
                "input_summary": selected["product_id"],
                "sequence": sequence,
            },
        )

        add_result = await execute_tool(
            session=session,
            session_id=session_id,
            sequence=sequence,
            tool_name="add_to_quote",
            args={
                "quote_id": quote_id,
                "product_id": selected["product_id"],
                "quantity": quantity,
                "idempotency_key": idempotency_key,
                "source_message_id": session_id,
                "allow_backorder": False,
            },
        )

        quote_delta = add_result.get("quote_delta")

        yield _sse(
            EVT_TOOL_RESULT,
            {
                "tool": "add_to_quote",
                "sequence": sequence,
                "success": "error" not in add_result,
                "quote_delta": quote_delta,
            },
        )

    elif wants_update and quote.get("items"):
        target_product_id = _extract_product_id(msg) or _pick_first_active_product_id(quote)

        if target_product_id:
            sequence += 1

            yield _sse(
                EVT_TOOL_START,
                {
                    "tool": "update_quote_item",
                    "input_summary": target_product_id,
                    "sequence": sequence,
                },
            )

            update_result = await execute_tool(
                session=session,
                session_id=session_id,
                sequence=sequence,
                tool_name="update_quote_item",
                args={
                    "quote_id": quote_id,
                    "product_id": target_product_id,
                    "quantity": quantity,
                    "reason": "fallback_quantity_update",
                },
            )

            quote_delta = update_result.get("quote_delta")

            yield _sse(
                EVT_TOOL_RESULT,
                {
                    "tool": "update_quote_item",
                    "sequence": sequence,
                    "success": "error" not in update_result,
                    "quote_delta": quote_delta,
                },
            )

    elif wants_replace and quote.get("items") and products:
        from_product_id = _extract_product_id(msg) or _pick_first_active_product_id(quote)
        to_product = _pick_replacement_product(products, from_product_id)

        if from_product_id and to_product:
            sequence += 1

            idempotency_key = _make_idempotency_key(
                session_id,
                message,
                "replace_with_alternative",
                from_product_id,
                to_product["product_id"],
            )

            yield _sse(
                EVT_TOOL_START,
                {
                    "tool": "replace_with_alternative",
                    "input_summary": f"{from_product_id} -> {to_product['product_id']}",
                    "sequence": sequence,
                },
            )

            replace_result = await execute_tool(
                session=session,
                session_id=session_id,
                sequence=sequence,
                tool_name="replace_with_alternative",
                args={
                    "quote_id": quote_id,
                    "from_product_id": from_product_id,
                    "to_product_id": to_product["product_id"],
                    "quantity": quantity,
                    "reason": "fallback_replacement",
                    "idempotency_key": idempotency_key,
                },
            )

            quote_delta = replace_result.get("quote_delta")

            yield _sse(
                EVT_TOOL_RESULT,
                {
                    "tool": "replace_with_alternative",
                    "sequence": sequence,
                    "success": "error" not in replace_result,
                    "quote_delta": quote_delta,
                },
            )

    if sources:
        yield _sse(EVT_SOURCE, {"source_ids": sorted(set(sources))})

    reply = _build_fallback_reply(
        entries=entries,
        products=products,
        quote=quote,
        quote_delta=quote_delta,
        wants_add=wants_add,
        wants_update=wants_update,
        wants_replace=wants_replace,
    )

    for chunk in _chunk_text(reply, size=180):
        yield _sse(EVT_TEXT, {"text": chunk})

    yield _sse(EVT_DONE, {"session_id": session_id})


def _expand_query(message: str) -> str:
    msg = message.lower()
    expansions = [message]

    if "barkod" in msg or "scanner" in msg or "okuyucu" in msg:
        expansions.append("barkod okuyucu barcode scanner okuyucu qr 1d 2d")

    if "yazıcı" in msg or "printer" in msg:
        expansions.append("yazıcı printer receipt label bluetooth mobil")

    if "pos" in msg or "terminal" in msg:
        expansions.append("pos terminal android el terminali")

    if "garanti" in msg:
        expansions.append("garanti warranty kapsam")

    if "iade" in msg:
        expansions.append("iade return policy lisans donanım yazılım")

    if "teslimat" in msg or "kargo" in msg:
        expansions.append("teslimat delivery süre şehir")

    if "uyumlu" in msg or "uyumluluk" in msg:
        expansions.append("uyumluluk compatibility software modül")

    return " ".join(expansions)


def _is_policy_question(msg: str) -> bool:
    keywords = [
        "iade",
        "garanti",
        "teslimat",
        "kargo",
        "politika",
        "uyumluluk",
        "uyumlu",
        "lisans",
        "stok",
        "indirim",
        "kurulum",
        "fiyat kuralı",
        "backorder",
    ]
    return any(word in msg for word in keywords)


def _is_product_question(msg: str) -> bool:
    keywords = [
        "ürün",
        "barkod",
        "okuyucu",
        "scanner",
        "yazıcı",
        "printer",
        "pos",
        "terminal",
        "aksesuar",
        "şarj",
        "lisans",
        "öner",
        "ara",
        "bul",
    ]
    return any(word in msg for word in keywords)


def _is_add_request(msg: str) -> bool:
    keywords = [
        "ekle",
        "teklife ekle",
        "sepete ekle",
        "quote'a ekle",
        "almak istiyorum",
        "satın almak",
        "taslağa ekle",
    ]
    return any(word in msg for word in keywords)


def _is_update_request(msg: str) -> bool:
    keywords = [
        "miktar",
        "adet",
        "quantity",
        "güncelle",
        "3 yap",
        "2 yap",
        "1 yap",
        "sıfır yap",
    ]
    return any(word in msg for word in keywords) and not _is_replace_request(msg)


def _is_replace_request(msg: str) -> bool:
    keywords = [
        "alternatif",
        "muadil",
        "yerine",
        "değiştir",
        "daha ucuz",
        "stoklu alternatif",
    ]
    return any(word in msg for word in keywords)


def _extract_max_price_try(msg: str) -> float | None:
    price_context_words = [
        "altında",
        "altı",
        "max",
        "maksimum",
        "bütçe",
        "limit",
        "tl",
        "try",
        "₺",
        "liraya",
    ]

    if not any(word in msg for word in price_context_words):
        return None

    matches = re.findall(r"(\d[\d\.\,]*)", msg)

    numbers = []
    for match in matches:
        normalized = match.replace(".", "").replace(",", ".")
        try:
            numbers.append(float(normalized))
        except ValueError:
            pass

    return max(numbers) if numbers else None


def _extract_quantity(msg: str) -> int:
    matches = re.findall(r"(\d+)\s*(adet|tane|qty|quantity)?", msg)

    for value, unit in matches:
        number = int(value)
        if unit or number <= 50:
            return max(number, 0)

    return 1


def _extract_product_id(msg: str) -> str | None:
    match = re.search(r"(prd-[a-z0-9\-]+)", msg, re.IGNORECASE)
    return match.group(1).upper() if match else None


def _detect_category(msg: str) -> str | None:
    if "barkod" in msg or "scanner" in msg or "okuyucu" in msg:
        return "barcode_scanner"

    if "pos" in msg or "terminal" in msg:
        return "pos_terminal"

    if "fiş" in msg or "receipt" in msg:
        return "receipt_printer"

    if "etiket" in msg or "label" in msg:
        return "label_printer"

    if "kurulum" in msg or "hizmet" in msg:
        return "service"

    if "aksesuar" in msg or "şarj" in msg:
        return "accessory"

    return None


def _detect_tags(msg: str) -> list[str]:
    tags = []

    if "usb" in msg:
        tags.append("usb")

    if "bluetooth" in msg or "kablosuz" in msg:
        tags.append("bluetooth")

    if "qr" in msg or "2d" in msg:
        tags.append("2d")

    if "1d" in msg:
        tags.append("1d")

    if "rugged" in msg or "endüstriyel" in msg:
        tags.append("rugged")

    return tags


def _detect_topic(msg: str) -> str | None:
    if "iade" in msg:
        return "return_policy"

    if "teslimat" in msg or "kargo" in msg:
        return "delivery_policy"

    if "garanti" in msg:
        return "warranty"

    if "indirim" in msg:
        return "discount_policy"

    if "stok" in msg:
        return "stock_policy"

    if "uyumlu" in msg or "uyumluluk" in msg:
        return "compatibility"

    if "kurulum" in msg:
        return "installation"

    if "fiyat" in msg:
        return "pricing"

    return None


def _pick_first_active_product_id(quote: dict) -> str | None:
    for item in quote.get("items", []):
        if item.get("status") == "active":
            return item.get("product_id")

    return None


def _pick_replacement_product(
    products: list[dict],
    from_product_id: str | None,
) -> dict | None:
    for product in products:
        if (
            product.get("product_id") != from_product_id
            and product.get("stock_qty", 0) > 0
        ):
            return product

    return None


def _make_idempotency_key(*parts: str) -> str:
    raw = "|".join(str(part) for part in parts)
    return str(uuid.uuid5(uuid.NAMESPACE_URL, raw))


def _build_fallback_reply(
    entries: list[dict],
    products: list[dict],
    quote: dict,
    quote_delta: dict | None,
    wants_add: bool,
    wants_update: bool,
    wants_replace: bool,
) -> str:
    parts = ["[Yedek mod aktif — LLM olmadan kaynaklı yanıt üretildi]\n\n"]

    if quote_delta:
        action = quote_delta.get("action")

        if action == "item_added":
            parts.append("Teklif taslağı güncellendi: ürün teklife eklendi.\n\n")
        elif action == "quantity_increased":
            parts.append("Teklif taslağı güncellendi: mevcut ürünün miktarı artırıldı.\n\n")
        elif action == "quantity_updated":
            parts.append("Teklif taslağı güncellendi: ürün miktarı güncellendi.\n\n")
        elif action == "item_replaced":
            parts.append("Teklif taslağı güncellendi: ürün stoklu alternatifle değiştirildi.\n\n")
        elif action == "item_removed":
            parts.append("Teklif taslağı güncellendi: ürün pasifleştirildi.\n\n")

    elif wants_add or wants_update or wants_replace:
        parts.append(
            "İstenen teklif değişikliği güvenli şekilde tamamlanamadı. "
            "Lütfen ürün kodunu veya isteği daha açık belirtin.\n\n"
        )

    if products:
        parts.append("Uygun ürün adayları:\n")
        for product in products[:3]:
            parts.append(
                f"• {product['name_tr']} "
                f"({product['product_id']}) — "
                f"{product['price_try']} TRY, stok: {product['stock_qty']}\n"
            )
        parts.append("\n")

    if entries:
        parts.append("İlgili bilgi kaynakları:\n")
        for entry in entries[:3]:
            parts.append(
                f"• {entry['title']} "
                f"(Kaynak: {entry['knowledge_id']})\n"
                f"  {entry['body'][:220]}...\n"
            )
        parts.append("\n")

    if quote:
        parts.append(
            f"Güncel teklif: {quote.get('quote_id')} — "
            f"Toplam: {quote.get('total_try', 0)} "
            f"{quote.get('currency', 'TRY')}\n"
        )

    return "".join(parts)


def _chunk_text(text: str, size: int = 180) -> list[str]:
    return [text[i : i + size] for i in range(0, len(text), size)]