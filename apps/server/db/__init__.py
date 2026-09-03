from importlib import import_module

ProductRepository = import_module("db.product_repository").ProductRepository
DocumentRepository = import_module("db.document_repository").DocumentRepository
VectorRepository = import_module("db.vector_repository").VectorRepository
UserRepository = import_module("db.user_repository").UserRepository
OrderRepository = import_module("db.order_repository").OrderRepository

__all__ = [
    "ProductRepository",
    "DocumentRepository",
    "VectorRepository",
    "UserRepository",
    "OrderRepository",
]
