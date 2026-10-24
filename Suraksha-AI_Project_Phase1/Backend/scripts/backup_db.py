import os
import shutil
from datetime import datetime

def backup_database():
    # Base paths
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(scripts_dir)
    
    db_file = os.path.join(project_root, 'suraksha.db')
    backup_dir = os.path.join(project_root, 'backups')
    
    # Check if DB file exists
    if not os.path.exists(db_file):
        print(f"ERROR: SQLite database file not found at '{db_file}'. Nothing to backup.")
        return False
        
    # Ensure backup directory exists
    os.makedirs(backup_dir, exist_ok=True)
    
    # Generate timestamped backup filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"suraksha_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    try:
        shutil.copy2(db_file, backup_path)
        print(f"Database backup completed successfully.")
        print(f"Backup file location: '{backup_path}'")
        return True
    except Exception as e:
        print(f"ERROR: Database backup failed: {str(e)}")
        return False

if __name__ == '__main__':
    backup_database()
