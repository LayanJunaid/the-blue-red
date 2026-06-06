from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    message: str
    quote_id: str
    customer_id: str
    session_id: Optional[str] = None