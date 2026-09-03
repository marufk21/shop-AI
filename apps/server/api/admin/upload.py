from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from core.dependencies import get_cloudinary_uploader, require_admin_user
from models import User
from utils.cloudinary import CloudinaryUploader

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/avif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "products",
    _: User = Depends(require_admin_user),
    uploader: CloudinaryUploader = Depends(get_cloudinary_uploader),
) -> dict[str, object]:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid file type: {file.content_type}. "
                f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}"
            ),
        )

    file_data = await file.read()
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10 MB limit")

    try:
        result = await uploader.upload_image(file_data, folder=folder)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}") from e

    return result
