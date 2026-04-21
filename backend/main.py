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