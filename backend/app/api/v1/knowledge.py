import json
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.knowledge import KnowledgeEntry
from app.schemas.knowledge import KnowledgeOut, KnowledgeCreate

router = APIRouter()


def serialize_knowledge(entry: KnowledgeEntry):
    return {
        "knowledge_id": entry.knowledge_id,
        "topic": entry.topic,
        "locale": entry.locale,
        "title": entry.title,
        "body": entry.body,
        "source": entry.source,
        "applies_to": json.loads(entry.applies_to)
        if isinstance(entry.applies_to, str)
        else entry.applies_to,
        "effective_from": entry.effective_from.isoformat()
        if entry.effective_from
        else None,
    }


@router.get("/knowledge", response_model=list[KnowledgeOut])
async def list_knowledge(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(KnowledgeEntry))
    entries = result.scalars().all()

    return [serialize_knowledge(entry) for entry in entries]


@router.post("/knowledge", response_model=KnowledgeOut, status_code=201)
async def create_knowledge(
    body: KnowledgeCreate,
    db: AsyncSession = Depends(get_db),
):
    data = body.model_dump()

    entry = KnowledgeEntry(
        knowledge_id=data["knowledge_id"],
        topic=data["topic"],
        locale=data["locale"],
        title=data["title"],
        body=data["body"],
        source=data["source"],
        applies_to=json.dumps(data["applies_to"]),
        effective_from=date.fromisoformat(data["effective_from"]),
    )

    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return serialize_knowledge(entry)