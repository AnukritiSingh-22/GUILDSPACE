from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import engine
from app.database.base import Base

from app.routes import user_routes, project_routes, application_routes, ai_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GUILDSPACE API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes.router)
app.include_router(project_routes.router)
app.include_router(application_routes.router)
app.include_router(ai_routes.router)

@app.get("/")
def root():
    return {"message": "GUILDSPACE backend running"}