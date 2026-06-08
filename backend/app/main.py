from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.core.config import getSettings
from app.core.database import databaseManager
from app.services.auth_service import AuthService
from app.services.content_service import ContentService


class PortfolioApplication:
    def __init__(self) -> None:
        self.settings = getSettings()
        self.app = FastAPI(title=self.settings.appName)
        self.configure()

    def configure(self) -> None:
        databaseManager.initialize()
        AuthService(databaseManager).seedDefaultRolesAndAdmin()
        ContentService(databaseManager).seedTemplateContent()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=self.settings.corsOrigins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        self.app.mount("/media", StaticFiles(directory=self.settings.uploadDir), name="media")
        self.app.include_router(router)


portfolioApplication = PortfolioApplication()
app = portfolioApplication.app
