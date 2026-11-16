import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_jwt_secret_key')
    SQLALCHEMY_DATABASE_URI = os.getenv('ACCOUNT_DATABASE_URL', 'postgresql://user:password@localhost/account_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
