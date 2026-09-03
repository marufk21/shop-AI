import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)

from controllers.admin.product_controller import AdminProductController
from core.dependencies import get_admin_product_controller, require_admin_user
from models import User
from schemas import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: str = Form(..., description="JSON string of ProductCreate"),
    image: UploadFile | None = File(None),
    _: User = Depends(require_admin_user),
    controller: AdminProductController = Depends(get_admin_product_controller),
) -> ProductResponse:
    try:
        product_data = ProductCreate.model_validate_json(data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid product data: {e}") from e

    image_bytes = await image.read() if image else None
    product = await controller.create_product(product_data, image_bytes)
    return ProductResponse.model_validate(product)


@router.get("", response_model=ProductListResponse)
async def list_products(
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=10000),
    _: User = Depends(require_admin_user),
    controller: AdminProductController = Depends(get_admin_product_controller),
) -> ProductListResponse:
    return await controller.list_products(
        status_filter=status_filter, search=search, skip=skip, limit=limit
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    _: User = Depends(require_admin_user),
    controller: AdminProductController = Depends(get_admin_product_controller),
) -> ProductResponse:
    product = await controller.get_product(product_id)
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: str = Form(..., description="JSON string of ProductUpdate"),
    image: UploadFile | None = File(None),
    remove_image: bool = Form(False),
    _: User = Depends(require_admin_user),
    controller: AdminProductController = Depends(get_admin_product_controller),
) -> ProductResponse:
    try:
        update_data = ProductUpdate.model_validate_json(data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid product data: {e}") from e

    image_bytes = await image.read() if image else None
    product = await controller.update_product(
        product_id, update_data, image_bytes, remove_image=remove_image
    )
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    _: User = Depends(require_admin_user),
    controller: AdminProductController = Depends(get_admin_product_controller),
) -> None:
    await controller.delete_product(product_id)
