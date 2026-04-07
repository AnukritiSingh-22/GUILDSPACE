# Reads environment variables from .env file using pydantic-settings.
# Import `settings` anywhere in the app to access config values.
# ─────────────────────────────────────────────────────────────────────────────
 
from pydantic_settings import BaseSettings
 
 
class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080   # 7 days
    FRONTEND_URL: str = "http://localhost:3000"
    DEBUG: bool = False
 
    class Config:
        env_file = ".env"
        extra = "ignore"
 
 
settings = Settings()