from fastapi import APIRouter, Depends, File, Query, UploadFile

from fastapi import HTTPException, status

from app.api.dependencies import getCurrentUser, getOptionalCurrentUser, hasAuthorRole, requireAdministrator, requireAuthor
from app.core.database import databaseManager
from app.schemas.common import (
    CommentModerationPayload,
    CommentPayload,
    ContentItemPayload,
    LoginRequest,
    LoginResponse,
    UserProfile,
)
from app.services.auth_service import AuthService
from app.services.content_service import ContentService
from app.services.media_service import mediaService


router = APIRouter(prefix="/api")
authService = AuthService(databaseManager)
contentService = ContentService(databaseManager)


@router.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest) -> LoginResponse:
    token, user = authService.authenticate(request)
    return LoginResponse(accessToken=token, user=user)


@router.get("/auth/me", response_model=UserProfile)
def getMe(currentUser: UserProfile = Depends(getCurrentUser)) -> UserProfile:
    return currentUser


@router.get("/roles")
def listRoles(_: UserProfile = Depends(requireAdministrator)) -> list[dict]:
    return authService.listRoles()


@router.get("/content")
def listContent(
    contentType: str | None = Query(default=None),
    includeHidden: bool = Query(default=False),
    currentUser: UserProfile | None = Depends(getOptionalCurrentUser),
) -> list[dict]:
    if includeHidden and not hasAuthorRole(currentUser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Author role required")
    return contentService.listContentItems(contentType=contentType, includeHidden=includeHidden)


@router.get("/content/{slug}")
def getContent(
    slug: str,
    includeHidden: bool = Query(default=False),
    currentUser: UserProfile | None = Depends(getOptionalCurrentUser),
) -> dict:
    if includeHidden and not hasAuthorRole(currentUser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Author role required")
    return contentService.getContentItem(slug, includeHidden=includeHidden)


@router.post("/content")
def createContent(payload: ContentItemPayload, _: UserProfile = Depends(requireAuthor)) -> dict:
    return contentService.createContentItem(payload)


@router.put("/content/{itemId}")
def updateContent(itemId: int, payload: ContentItemPayload, _: UserProfile = Depends(requireAuthor)) -> dict:
    return contentService.updateContentItem(itemId, payload)


@router.delete("/content/{itemId}")
def deleteContent(itemId: int, _: UserProfile = Depends(requireAuthor)) -> dict:
    contentService.deleteContentItem(itemId)
    return {"success": True}


@router.post("/media")
async def uploadMedia(imageFile: UploadFile = File(...), _: UserProfile = Depends(requireAuthor)) -> dict:
    imagePath = await mediaService.savePortraitImage(imageFile)
    return {"imagePath": imagePath}


@router.get("/works/{workId}/comments")
def listComments(workId: int) -> list[dict]:
    return contentService.listComments(workId=workId)


@router.post("/works/{workId}/comments")
def createComment(workId: int, payload: CommentPayload) -> dict:
    return contentService.createComment(workId, payload)


@router.get("/comments")
def listAllComments(_: UserProfile = Depends(requireAuthor)) -> list[dict]:
    return contentService.listComments(includeModerated=True)


@router.put("/comments/{commentId}")
def moderateComment(
    commentId: int,
    payload: CommentModerationPayload,
    _: UserProfile = Depends(requireAuthor),
) -> dict:
    return contentService.moderateComment(commentId, payload)
