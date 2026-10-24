from datetime import datetime
from app.models.attack_log import AttackLog
from app.repositories.base_repository import BaseRepository

class AttackRepository(BaseRepository):
    def __init__(self):
        super().__init__(AttackLog)

    def search_and_filter(self, search_q=None, threat_level=None, status=None, start_date=None, end_date=None, page=1, per_page=10, sort_by='timestamp', order='desc'):
        """
        Advanced query engine supporting keyword search, threat levels, blocking statuses,
        and date ranges. Sorts and paginates results.
        """
        query = self.model.query

        # Apply search pattern (Client IP, Payload, Endpoint URL)
        if search_q:
            pattern = f"%{search_q}%"
            query = query.filter(
                (self.model.client_ip.like(pattern)) |
                (self.model.payload.like(pattern)) |
                (self.model.url.like(pattern))
            )

        # Apply threat level filter
        if threat_level and threat_level.lower() != 'all':
            query = query.filter(self.model.threat_level.ilike(threat_level))

        # Apply status filter (e.g. Blocked, Logged, Allowed)
        if status and status.lower() != 'all':
            query = query.filter(self.model.status.ilike(status))

        # Apply date filters
        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date.split('T')[0], '%Y-%m-%d')
            query = query.filter(self.model.timestamp >= start_date)
        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date.split('T')[0], '%Y-%m-%d')
            query = query.filter(self.model.timestamp <= end_date)

        # Determine sorting field
        sort_column = getattr(self.model, sort_by, self.model.timestamp)
        if order.lower() == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        return self.paginate(query, page, per_page)

    def search(self, query_string, page=1, per_page=10):
        """Simplistic query wrapper to satisfy interface requirements."""
        return self.search_and_filter(search_q=query_string, page=page, per_page=per_page)
