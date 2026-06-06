from pydantic import BaseModel
from typing import Any


class KnowledgeOut(BaseModel):
    knowledge_id: str
    topic: str
    locale: str
    title: str
    body: str
    source: str
    applies_to: Any
    effective_from: Any

    model_config = {"from_attributes": True}


class KnowledgeCreate(BaseModel):
    knowledge_id: str
    topic: str
    locale: str = "tr"
    title: str
    body: str
    source: str
    applies_to: Any = []
    effective_from: str
