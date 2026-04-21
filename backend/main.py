# # GuildSpace FastAPI application entry point.
# # Run with:  uvicorn main:app --reload
# # ─────────────────────────────────────────────────────────────────────────────

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from dotenv import load_dotenv
# load_dotenv()

# from app.routes.ai_routes import router as ai_router

# import os
# from fastapi.staticfiles import StaticFiles

# app = FastAPI()

# app.include_router(ai_router)

# os.makedirs("static/avatars", exist_ok=True)
# app.mount("/static", StaticFiles(directory="static"), name="static")

# from app.database.config import settings
# from app.database.db import engine
# from app.database import base  # noqa — imports all models so create_all sees them
# from app.database.db import Base

# # Import routers
# from app.routes.user_routes        import router as user_router
# from app.routes.project_routes     import router as project_router
# from app.routes.application_routes import router as application_router
# from app.routes.ai_routes          import router as ai_router
# from app.routes.follow_routes      import router as follow_router
# from app.routes.search_routes      import router as search_router
# from app.routes.notification_routes import router as notification_router
# from app.routes.message_routes     import router as message_router
# from app.routes.rating_routes      import router as rating_router

# # ── Create tables (dev only — use Alembic in production) ─────────────────────
# Base.metadata.create_all(bind=engine)

# # ── FastAPI app ───────────────────────────────────────────────────────────────
# app = FastAPI(
#     title       = "GuildSpace API",
#     description = "Backend for the GuildSpace collaboration platform",
#     version     = "1.0.0",
#     docs_url    = "/api/docs",    # Swagger UI
#     redoc_url   = "/api/redoc",   # ReDoc
# )

# # ── CORS ──────────────────────────────────────────────────────────────────────
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins     = [settings.FRONTEND_URL, "http://localhost:3000"],
#     allow_credentials = True,
#     allow_methods     = ["*"],
#     allow_headers     = ["*"],
# )

# # ── Routers ───────────────────────────────────────────────────────────────────
# # Auth endpoints (signup + login) live inside user_router at /api/auth/*
# app.include_router(user_router,        prefix="/api",  tags=["auth", "users"])
# app.include_router(project_router)                                              # prefix set inside file
# app.include_router(application_router)                                          # prefix set inside file
# app.include_router(ai_router)                                                   # prefix set inside file
# app.include_router(follow_router)
# app.include_router(search_router)
# app.include_router(notification_router)
# app.include_router(message_router)
# app.include_router(rating_router)

# # ── Health check ──────────────────────────────────────────────────────────────
# @app.get("/api/health", tags=["health"])
# def health():
#     return {"status": "ok", "version": "1.0.0"}

# GuildSpace FastAPI application entry point.
# Run with: uvicorn main:app --reload

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from app.database.config import settings
from app.database.db import engine, Base
from app.database import base  # noqa — imports all models so create_all sees them

from app.routes.user_routes         import router as user_router
from app.routes.project_routes      import router as project_router
from app.routes.application_routes  import router as application_router
from app.routes.ai_routes           import router as ai_router
from app.routes.follow_routes       import router as follow_router
from app.routes.search_routes       import router as search_router
from app.routes.notification_routes import router as notification_router
from app.routes.message_routes      import router as message_router
from app.routes.rating_routes       import router as rating_router

# Create tables
Base.metadata.create_all(bind=engine)

# Create app — only once
app = FastAPI(
    title       = "GuildSpace API",
    description = "Backend for the GuildSpace collaboration platform",
    version     = "1.0.0",
    docs_url    = "/api/docs",
    redoc_url   = "/api/redoc",
)

# CORS — must be before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# Static files for avatars
os.makedirs("static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers — each registered once
app.include_router(user_router,         prefix="/api", tags=["auth", "users"])
app.include_router(project_router)
app.include_router(application_router)
app.include_router(ai_router)
app.include_router(follow_router)
app.include_router(search_router)
app.include_router(notification_router)
app.include_router(message_router)
app.include_router(rating_router)

@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "version": "1.0.0"}