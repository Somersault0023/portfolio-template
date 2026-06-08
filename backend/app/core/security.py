from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import getSettings


class SecurityService:
    def __init__(self) -> None:
        self.passwordContext = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
        self.algorithm = "HS256"

    def hashPassword(self, password: str) -> str:
        return self.passwordContext.hash(password)

    def verifyPassword(self, plainPassword: str, passwordHash: str) -> bool:
        return self.passwordContext.verify(plainPassword, passwordHash)

    def createAccessToken(self, subject: str, claims: dict[str, Any] | None = None) -> str:
        settings = getSettings()
        expiresAt = datetime.now(timezone.utc) + timedelta(minutes=settings.accessTokenExpireMinutes)
        payload = {"sub": subject, "exp": expiresAt}
        if claims:
            payload.update(claims)
        return jwt.encode(payload, settings.secretKey, algorithm=self.algorithm)

    def decodeAccessToken(self, token: str) -> dict[str, Any] | None:
        try:
            return jwt.decode(token, getSettings().secretKey, algorithms=[self.algorithm])
        except JWTError:
            return None


securityService = SecurityService()
