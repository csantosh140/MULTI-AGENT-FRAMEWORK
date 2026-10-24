from app.models.user import User
from app.repositories.base_repository import BaseRepository

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)

    def find_by_email(self, email):
        """Retrieves user details by email index."""
        if not email:
            return None
        return self.model.query.filter_by(email=email.strip().lower()).first()

    def search(self, query_string, page=1, per_page=10):
        """Search users by name or email with pagination."""
        query = self.model.query
        if query_string:
            search_pattern = f"%{query_string}%"
            query = query.filter(
                (self.model.name.like(search_pattern)) | 
                (self.model.email.like(search_pattern))
            )
        return self.paginate(query, page, per_page)
