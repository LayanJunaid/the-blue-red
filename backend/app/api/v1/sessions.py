from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.tool_call_log import ToolCallLog

router = APIRouter()


@router.get("/sessions/{session_id}/logs")
async def get_session_logs(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ToolCallLog)
        .where(ToolCallLog.session_id == session_id)
        .order_by(ToolCallLog.sequence)
    )
    logs = result.scalars().all()
    return [
        {
            "id": l.id,
            "session_id": l.session_id,
            "sequence": l.sequence,
            "tool_name": l.tool_name,
            "input_summary": l.input_summary,
            "success": l.success,
            "error_message": l.error_message,
            "quote_delta": l.quote_delta,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


@router.get("/sessions")
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ToolCallLog.session_id, ToolCallLog.created_at)
        .distinct(ToolCallLog.session_id)
        .order_by(ToolCallLog.session_id, ToolCallLog.created_at.desc())
    )
    rows = result.all()
    return [{"session_id": r.session_id, "created_at": r.created_at.isoformat() if r.created_at else None} for r in rows]
