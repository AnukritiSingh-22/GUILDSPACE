# main.py
# ─────────────────────────────────────────────────────────────────────────────
# GuildSpace FastAPI application entry point.
# Run with:  uvicorn main:app --reload
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.config import settings
from app.database.db import engine
from app.database import base  # noqa — imports all models so create_all sees them
from app.database.db import Base

# Import routers
from app.routes.user_routes        import router as user_router
from app.routes.project_routes     import router as project_router
from app.routes.application_routes import router as application_router
from app.routes.ai_routes          import router as ai_router

# ── Create tables (dev only — use Alembic in production) ─────────────────────
Base.metadata.create_all(bind=engine)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "GuildSpace API",
    description = "Backend for the GuildSpace collaboration platform",
    version     = "1.0.0",
    docs_url    = "/api/docs",    # Swagger UI
    redoc_url   = "/api/redoc",   # ReDoc
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
# Auth endpoints (signup + login) live inside user_router at /api/auth/*
app.include_router(user_router,        prefix="/api",  tags=["auth", "users"])
app.include_router(project_router)                                              # prefix set inside file
app.include_router(application_router)                                          # prefix set inside file
app.include_router(ai_router)                                                   # prefix set inside file

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "version": "1.0.0"}