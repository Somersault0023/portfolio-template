from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.database import databaseManager
from app.core.security import securityService
from app.schemas.common import UserProfile
from app.services.auth_service import AuthService


oauth2Scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optionalOauth2Scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
authService = AuthService(databaseManager)


def getCurrentUser(token: str = Depends(oauth2Scheme)) -> UserProfile:
    payload = securityService.decodeAccessToken(token)
    if payload is None or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = authService.getUserById(int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user


def requireAuthor(currentUser: UserProfile = Depends(getCurrentUser)) -> UserProfile:
    if not {"author", "administrator"}.intersection(set(currentUser.roles)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Author role required")
    return currentUser


def requireAdministrator(currentUser: UserProfile = Depends(getCurrentUser)) -> UserProfile:
    if "administrator" not in currentUser.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator role required")
    return currentUser


def getOptionalCurrentUser(token: str | None = Depends(optionalOauth2Scheme)) -> UserProfile | None:
    if token is None:
        return None
    payload = securityService.decodeAccessToken(token)
    if payload is None or "sub" not in payload:
        return None
    return authService.getUserById(int(payload["sub"]))


def hasAuthorRole(user: UserProfile | None) -> bool:
    return user is not None and bool({"author", "administrator"}.intersection(set(user.roles)))
