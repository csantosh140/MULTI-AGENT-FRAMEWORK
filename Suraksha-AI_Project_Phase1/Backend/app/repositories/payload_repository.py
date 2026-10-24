from app.models.payload import Payload
from app.repositories.base_repository import BaseRepository

class PayloadRepository(BaseRepository):
    def __init__(self):
        super().__init__(Payload)

    def search(self, query_string, page=1, per_page=10):
        """Search payloads by name or category or payload string content."""
        query = self.model.query
        if query_string:
            pattern = f"%{query_string}%"
            query = query.filter(
                (self.model.name.like(pattern)) |
                (self.model.category.like(pattern)) |
                (self.model.payload.like(pattern))
            )
        return self.paginate(query, page, per_page)
