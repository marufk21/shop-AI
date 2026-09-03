from importlib import import_module

ai_routes = import_module("api.admin.ai")
auth_routes = import_module("api.auth")
chat_routes = import_module("api.admin.chat")
document_routes = import_module("api.admin.documents")
order_routes = import_module("api.orders")
product_routes = import_module("api.admin.products")
upload_routes = import_module("api.admin.upload")
store_routes = import_module("api.store.products")
store_chat_routes = import_module("api.store.chat")

__all__ = [
    "ai_routes",
    "auth_routes",
    "product_routes",
    "order_routes",
    "store_routes",
    "store_chat_routes",
    "upload_routes",
    "document_routes",
    "chat_routes",
]
