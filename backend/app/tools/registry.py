"""
تعريف الـ 6 tools بصيغة OpenAI function calling
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Metin sorgusu, Türkçe alias ve yapısal filtrelerle ürün adaylarını bulur.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "locale": {"type": "string", "default": "tr"},
                    "filters": {
                        "type": "object",
                        "properties": {
                            "category": {"type": ["string", "null"]},
                            "max_price_try": {"type": ["number", "null"]},
                            "in_stock_only": {"type": "boolean", "default": True},
                            "required_tags": {"type": "array", "items": {"type": "string"}},
                        },
                    },
                    "limit": {"type": "integer", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_knowledge_entries",
            "description": "Kaynak olarak kullanılacak politika veya uyumluluk kayıtlarını getirir.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "locale": {"type": "string", "default": "tr"},
                    "topic": {"type": ["string", "null"]},
                    "limit": {"type": "integer", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_quote",
            "description": "Web ve mobil yüzeyleri için ortak güncel teklif durumunu döndürür.",
            "parameters": {
                "type": "object",
                "properties": {
                    "quote_id": {"type": "string"},
                },
                "required": ["quote_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_quote",
            "description": "Ürünü taslak teklife ekler veya ürün zaten varsa miktarı artırır.",
            "parameters": {
                "type": "object",
                "properties": {
                    "quote_id": {"type": "string"},
                    "product_id": {"type": "string"},
                    "quantity": {"type": "integer"},
                    "idempotency_key": {"type": "string"},
                    "source_message_id": {"type": "string"},
                    "allow_backorder": {"type": "boolean", "default": False},
                },
                "required": ["quote_id", "product_id", "quantity", "idempotency_key"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_quote_item",
            "description": "Mevcut teklif kaleminin miktarını ayarlar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "quote_id": {"type": "string"},
                    "product_id": {"type": "string"},
                    "quantity": {"type": "integer"},
                    "reason": {"type": "string"},
                },
                "required": ["quote_id", "product_id", "quantity"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "replace_with_alternative",
            "description": "Mevcut teklif kalemini stokta olan alternatifle değiştirir.",
            "parameters": {
                "type": "object",
                "properties": {
                    "quote_id": {"type": "string"},
                    "from_product_id": {"type": "string"},
                    "to_product_id": {"type": "string"},
                    "quantity": {"type": ["integer", "null"]},
                    "reason": {"type": "string"},
                    "idempotency_key": {"type": "string"},
                },
                "required": ["quote_id", "from_product_id", "to_product_id", "idempotency_key"],
            },
        },
    },
]
