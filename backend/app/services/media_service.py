from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from PIL import Image

from app.core.config import getSettings


class MediaService:
    def __init__(self) -> None:
        self.settings = getSettings()

    async def savePortraitImage(self, imageFile: UploadFile) -> str:
        suffix = Path(imageFile.filename or "upload.jpg").suffix.lower() or ".jpg"
        targetPath = self.settings.uploadDir / f"{uuid4().hex}{suffix}"
        temporaryPath = self.settings.uploadDir / f"{uuid4().hex}-original{suffix}"
        content = await imageFile.read()
        temporaryPath.write_bytes(content)
        with Image.open(temporaryPath) as image:
            converted = image.convert("RGB")
            cropped = self.cropToFolioRatio(converted)
            cropped.save(targetPath, quality=88, optimize=True)
        temporaryPath.unlink(missing_ok=True)
        return f"/media/{targetPath.name}"

    def cropToFolioRatio(self, image: Image.Image) -> Image.Image:
        targetRatio = 1 / 1.4142
        width, height = image.size
        currentRatio = width / height
        if currentRatio > targetRatio:
            newWidth = int(height * targetRatio)
            left = (width - newWidth) // 2
            return image.crop((left, 0, left + newWidth, height))
        newHeight = int(width / targetRatio)
        top = (height - newHeight) // 2
        return image.crop((0, top, width, top + newHeight))


mediaService = MediaService()
