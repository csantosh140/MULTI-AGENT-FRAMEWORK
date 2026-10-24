import os
import sys

# Ensure root directory is in sys.path to resolve app imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from scripts.seed_db import seed_database

def reset_db():
    print("WARNING: Re-initializing database. All existing tables and contents will be deleted.")
    app = create_app()
    with app.app_context():
        # Drop all tables
        db.drop_all()
        print("-> All database tables dropped.")
        
        # Recreate tables
        db.create_all()
        print("-> All database tables recreated.")
        
        # Populate tables with seeded data
        seed_database()

if __name__ == '__main__':
    reset_db()
