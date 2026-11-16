import os
from dotenv import load_dotenv

# Ensure environment variables are loaded from the root .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

class Config:
    """Centralized configuration loader for Suraksha-AI backend services."""
    # IMPORTANT: In a production environment, these secret keys MUST be overridden
    # with strong, randomly generated values in the production .env file.
    # DO NOT use default values in production.
    SECRET_KEY = os.getenv('SECRET_KEY', 'CHANGE_ME_TO_A_VERY_STRONG_RANDOM_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'CHANGE_ME_TO_ANOTHER_VERY_STRONG_RANDOM_KEY')
    PORT = int(os.getenv('PORT', 5000))
    # Set DEBUG to False in production environments.
    # For local development, set DEBUG=True in your .env file.
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    DVWA_URL = os.getenv('DVWA_URL', 'http://localhost/dvwa')
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Static JWT expiration configuration for safety operations
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour

    # Database settings
    # For production environments, consider using a more robust database like PostgreSQL or MySQL.
    db_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'suraksha.db'))
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{db_path}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
