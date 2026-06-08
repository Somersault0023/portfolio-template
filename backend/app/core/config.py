from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    appName: str = "Fiction Author Portfolio API"
    environment: str = "development"
    databasePath: Path = Path("app/storage/portfolio.sqlite3")
    uploadDir: Path = Path("app/storage/uploads")
    secretKey: str = "change-this-secret-before-production"
    accessTokenExpireMinutes: int = 60
    defaultLanguage: str = "es"
    corsOrigins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config: env_file = ".env"


@lru_cache
def getSettings() -> AppSettings:
    settings = AppSettings()
    settings.databasePath.parent.mkdir(parents=True, exist_ok=True)
    settings.uploadDir.mkdir(parents=True, exist_ok=True)
    return settings
