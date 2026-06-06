from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.chat import ChatRequest
from app.services.chat_service import chat_stream
import uuid

router = APIRouter()


@router.post("/chat/stream")
async def stream_chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    session_id = req.session_id or str(uuid.uuid4())
    return StreamingResponse(
        chat_stream(db, session_id, req.quote_id, req.customer_id, req.message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
