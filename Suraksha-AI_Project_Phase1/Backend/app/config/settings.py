import os
from dotenv import load_dotenv

# Ensure environment variables are loaded from the root .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

class Config:
    """Centralized configuration loader for Suraksha-AI backend services."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'suraksha_super_secret_session_key_98765')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'suraksha_jwt_signing_token_key_abcdef')
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    DVWA_URL = os.getenv('DVWA_URL', 'http://localhost/dvwa')
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Static JWT expiration configuration for safety operations
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour

    # Database settings
    db_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'suraksha.db'))
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{db_path}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
