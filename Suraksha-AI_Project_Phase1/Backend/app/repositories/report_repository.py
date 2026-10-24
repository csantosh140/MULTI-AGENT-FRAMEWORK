from app.models.report import Report
from app.repositories.base_repository import BaseRepository

class ReportRepository(BaseRepository):
    def __init__(self):
        super().__init__(Report)

    def search(self, query_string, page=1, per_page=10):
        """Search reports by report_name or report_type with pagination."""
        query = self.model.query
        if query_string:
            pattern = f"%{query_string}%"
            query = query.filter(
                (self.model.report_name.like(pattern)) |
                (self.model.report_type.like(pattern))
            )
        return self.paginate(query, page, per_page)
