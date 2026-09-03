from importlib import import_module

Product = import_module("models.product_model").Product
_user_model = import_module("models.user_model")
User = _user_model.User
Session = _user_model.Session
_order_model = import_module("models.order_model")
Order = _order_model.Order
OrderItem = _order_model.OrderItem

_document_model = import_module("models.document_model")
Document = _document_model.Document
DocumentChunk = _document_model.DocumentChunk

__all__ = [
    "Product",
    "User",
    "Session",
    "Order",
    "OrderItem",
    "Document",
    "DocumentChunk",
]
