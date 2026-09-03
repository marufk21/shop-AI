import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile

from controllers.admin.document_controller import DocumentController
from core.dependencies import get_document_controller, require_admin_user
from models import User
from schemas.document_schema import DocumentListResponse, DocumentResponse

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    _: User = Depends(require_admin_user),
    controller: DocumentController = Depends(get_document_controller),
) -> DocumentResponse:
    content = await file.read()
    document = await controller.upload_document(file.filename or "unknown", content)
    return DocumentResponse.model_validate(document)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin_user),
    controller: DocumentController = Depends(get_document_controller),
) -> DocumentListResponse:
    return await controller.list_documents(skip, limit)


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: uuid.UUID,
    _: User = Depends(require_admin_user),
    controller: DocumentController = Depends(get_document_controller),
) -> None:
    await controller.delete_document(document_id)
