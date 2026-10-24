from app.extensions import db

class BaseRepository:
    def __init__(self, model):
        self.model = model

    def create(self, **kwargs):
        """Creates a new record and commits it."""
        try:
            record = self.model(**kwargs)
            db.session.add(record)
            db.session.commit()
            return record
        except Exception as e:
            db.session.rollback()
            raise e

    def get_by_id(self, record_id):
        """Retrieves a single record by integer ID."""
        return self.model.query.get(record_id)

    def get_by_uuid(self, uuid_str):
        """Retrieves a single record by UUID string if it exists in the model."""
        if hasattr(self.model, 'uuid'):
            return self.model.query.filter_by(uuid=uuid_str).first()
        return None

    def get_all(self):
        """Retrieves all records."""
        return self.model.query.all()

    def update(self, record_id, **kwargs):
        """Updates fields of an existing record by ID."""
        record = self.get_by_id(record_id)
        if not record:
            return None
        try:
            for key, value in kwargs.items():
                if hasattr(record, key):
                    setattr(record, key, value)
            db.session.commit()
            return record
        except Exception as e:
            db.session.rollback()
            raise e

    def update_by_uuid(self, uuid_str, **kwargs):
        """Updates fields of an existing record by UUID."""
        record = self.get_by_uuid(uuid_str)
        if not record:
            return None
        try:
            for key, value in kwargs.items():
                if hasattr(record, key):
                    setattr(record, key, value)
            db.session.commit()
            return record
        except Exception as e:
            db.session.rollback()
            raise e

    def delete(self, record_id):
        """Deletes a record by ID."""
        record = self.get_by_id(record_id)
        if not record:
            return False
        try:
            db.session.delete(record)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e

    def delete_by_uuid(self, uuid_str):
        """Deletes a record by UUID."""
        record = self.get_by_uuid(uuid_str)
        if not record:
            return False
        try:
            db.session.delete(record)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e

    def paginate(self, query, page=1, per_page=10):
        """Paginates a query standardly, returning pagination object."""
        return query.paginate(page=page, per_page=per_page, error_out=False)
