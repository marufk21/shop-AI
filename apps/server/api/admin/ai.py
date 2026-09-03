from fastapi import APIRouter, Depends, HTTPException

from core.dependencies import require_admin_user
from models import User
from schemas.ai_schema import ImproveRequest, ImproveResponse
from utils.ai_generator import improve_text

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/improve", response_model=ImproveResponse)
async def improve(
    request: ImproveRequest, _: User = Depends(require_admin_user)
) -> ImproveResponse:
    try:
        improved = await improve_text(request.text, request.field)
        return ImproveResponse(improved_text=improved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
