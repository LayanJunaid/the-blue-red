from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import chat, quotes, products, knowledge, sessions, auth
from app.db.session import engine
from app.db.base import Base
from app.db.seed import run_seed
import app.models  # noqa: F401 — registers all models with Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await run_seed()
    yield
    await engine.dispose()


app = FastAPI(title="The Blue Red API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router,      prefix="/api/v1", tags=["chat"])
app.include_router(quotes.router,    prefix="/api/v1", tags=["quotes"])
app.include_router(products.router,  prefix="/api/v1", tags=["products"])
app.include_router(knowledge.router, prefix="/api/v1", tags=["knowledge"])
app.include_router(sessions.router,  prefix="/api/v1", tags=["sessions"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])

@app.get("/health")
async def health():
    return {"status": "ok"}
