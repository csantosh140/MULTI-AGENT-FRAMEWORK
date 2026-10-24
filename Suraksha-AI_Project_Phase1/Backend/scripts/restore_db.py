import os
import sys
import shutil
import glob

def restore_database(backup_path=None):
    # Base paths
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(scripts_dir)
    
    db_file = os.path.join(project_root, 'suraksha.db')
    backup_dir = os.path.join(project_root, 'backups')
    
    selected_backup = None

    # Check parameter
    if backup_path:
        if os.path.isabs(backup_path):
            selected_backup = backup_path
        else:
            selected_backup = os.path.join(backup_dir, backup_path)
    else:
        # Pick latest backup file automatically
        if not os.path.exists(backup_dir):
            print(f"ERROR: Backup directory not found at '{backup_dir}'. Cannot restore.")
            return False
            
        backup_files = glob.glob(os.path.join(backup_dir, "suraksha_backup_*.db"))
        if not backup_files:
            print("ERROR: No backup files found in the backups directory.")
            return False
            
        # Sort by modification time to get newest
        backup_files.sort(key=os.path.getmtime, reverse=True)
        selected_backup = backup_files[0]
        print(f"No backup file specified. Selecting latest backup: '{os.path.basename(selected_backup)}'")

    # Validate selected backup file exists
    if not os.path.exists(selected_backup):
        print(f"ERROR: Backup file not found at '{selected_backup}'")
        return False
        
    print(f"WARNING: Restoring database will overwrite the current live database file '{db_file}'.")
    
    try:
        # If live DB exists, make a temp safety copy first
        temp_safety = None
        if os.path.exists(db_file):
            temp_safety = db_file + ".tmp"
            shutil.copy2(db_file, temp_safety)
            
        # Perform restoration copy
        shutil.copy2(selected_backup, db_file)
        
        # Remove safety backup on success
        if temp_safety and os.path.exists(temp_safety):
            os.remove(temp_safety)
            
        print("Database restored successfully.")
        print(f"Source file: '{selected_backup}'")
        print(f"Destination: '{db_file}'")
        return True
    except Exception as e:
        print(f"ERROR: Database restoration failed: {str(e)}")
        # Recover from temp safety if failed
        if temp_safety and os.path.exists(temp_safety):
            shutil.copy2(temp_safety, db_file)
            os.remove(temp_safety)
            print("Successfully rolled back to the previous live database state.")
        return False

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else None
    restore_database(target)
