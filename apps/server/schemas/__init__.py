from importlib import import_module

_product_schema = import_module("schemas.product_schema")

ProductBase = _product_schema.ProductBase
ProductCreate = _product_schema.ProductCreate
ProductListResponse = _product_schema.ProductListResponse
ProductResponse = _product_schema.ProductResponse
ProductUpdate = _product_schema.ProductUpdate
CategoryItem = _product_schema.CategoryItem
CategoryListResponse = _product_schema.CategoryListResponse

_document_schema = import_module("schemas.document_schema")
DocumentResponse = _document_schema.DocumentResponse
DocumentListResponse = _document_schema.DocumentListResponse

_chat_schema = import_module("schemas.chat_schema")
ChatRequest = _chat_schema.ChatRequest
SourceCitation = _chat_schema.SourceCitation
_auth_schema = import_module("schemas.auth_schema")
SignUpRequest = _auth_schema.SignUpRequest
SignInRequest = _auth_schema.SignInRequest
AuthUserResponse = _auth_schema.AuthUserResponse
AuthResponse = _auth_schema.AuthResponse
_order_schema = import_module("schemas.order_schema")
OrderCreateItem = _order_schema.OrderCreateItem
OrderCreateRequest = _order_schema.OrderCreateRequest
OrderItemResponse = _order_schema.OrderItemResponse
OrderResponse = _order_schema.OrderResponse

__all__ = [
    "ProductBase",
    "ProductCreate",
    "ProductListResponse",
    "ProductResponse",
    "ProductUpdate",
    "CategoryItem",
    "CategoryListResponse",
    "DocumentResponse",
    "DocumentListResponse",
    "ChatRequest",
    "SourceCitation",
    "SignUpRequest",
    "SignInRequest",
    "AuthUserResponse",
    "AuthResponse",
    "OrderCreateItem",
    "OrderCreateRequest",
    "OrderItemResponse",
    "OrderResponse",
]
