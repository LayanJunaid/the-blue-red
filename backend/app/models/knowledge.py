from sqlalchemy import String, Text, Date
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    knowledge_id: Mapped[str] = mapped_column(String, primary_key=True)
    topic: Mapped[str] = mapped_column(String, nullable=False)
    locale: Mapped[str] = mapped_column(String, default="tr")
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    applies_to: Mapped[dict] = mapped_column(JSONB, default=list)
    effective_from: Mapped[str] = mapped_column(Date, nullable=False)
