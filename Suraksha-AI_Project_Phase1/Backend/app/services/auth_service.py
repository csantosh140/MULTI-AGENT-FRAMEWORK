from werkzeug.security import generate_password_hash, check_password_hash
from app.repositories.user_repository import UserRepository
from app.utils.validation import validate_email, validate_password

class AuthService:
    """Authentication and profile management service connected to SQLite."""
    
    _user_repository = UserRepository()

    @classmethod
    def authenticate_user(cls, email, password):
        """
        Authenticates a user against the database.
        Returns user profile info if successful, otherwise None.
        """
        if not email or not password:
            return None

        user = cls._user_repository.find_by_email(email)
        if user and check_password_hash(user.password_hash, password) and user.is_active:
            # Update last login time
            from datetime import datetime
            from app.extensions import db
            user.last_login = datetime.utcnow()
            db.session.commit()

            return {
                "id": user.uuid,
                "name": user.name,
                "email": user.email,
                "clearance": user.role
            }
        return None

    @classmethod
    def register_user(cls, name, email, password):
        """
        Registers a new operator user in the database.
        """
        if not name or not email or not password:
            return None, "Required parameter(s) missing."

        # Field validation
        valid_email, email_error = validate_email(email)
        if not valid_email:
            return None, email_error

        valid_pw, pw_error = validate_password(password)
        if not valid_pw:
            return None, pw_error

        cleaned_email = email.strip().lower()
        
        # Check duplicate emails
        existing = cls._user_repository.find_by_email(cleaned_email)
        if existing:
            return None, "Operator email already registered."

        try:
            # Create user record
            user = cls._user_repository.create(
                name=name.strip(),
                email=cleaned_email,
                password_hash=generate_password_hash(password),
                role="Operator (Level-1)",
                is_active=True
            )
            
            return {
                "id": user.uuid,
                "name": user.name,
                "email": user.email,
                "clearance": user.role
            }, None
        except Exception as e:
            return None, f"Database transaction failed: {str(e)}"

    @classmethod
    def get_user_profile(cls, email):
        """
        Retrieves user details from database by email.
        """
        user = cls._user_repository.find_by_email(email)
        if user and user.is_active:
            return {
                "id": user.uuid,
                "name": user.name,
                "email": user.email,
                "clearance": user.role
            }
        return None
