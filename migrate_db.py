"""
Database Migration Script for Glimmer
Handles schema updates for existing databases
"""

import sqlite3
import os

def migrate_database():
    """Migrate existing database to new schema"""
    db_path = 'glimmer.db'
    
    if not os.path.exists(db_path):
        print("No existing database found. A new one will be created when you start the server.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current schema
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        print(f"Current users table columns: {columns}")
        
        # Add missing columns if they don't exist
        if 'bio' not in columns:
            print("Adding 'bio' column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''")
            print("Added 'bio' column")
        
        if 'phone' not in columns:
            print("Adding 'phone' column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")
            print("Added 'phone' column")
        
        # Check if other tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Existing tables: {tables}")
        
        # Create missing tables
        required_tables = ['products', 'thoughts', 'clapbacks', 'conversations', 'messages', 'clocks']
        
        for table in required_tables:
            if table not in tables:
                print(f"Creating {table} table...")
                create_table(cursor, table)
        
        conn.commit()
        print("Database migration completed successfully!")
        
        # Show current state
        print("\n=== Current Database State ===")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Tables: {tables}")
        
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            print(f"{table}: {columns}")
        
    except Exception as e:
        print(f"Migration error: {e}")
        conn.rollback()
    finally:
        conn.close()

def create_table(cursor, table_name):
    """Create individual tables"""
    if table_name == 'products':
        cursor.execute('''
            CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT NOT NULL,
                product_description TEXT,
                product_cost REAL NOT NULL,
                product_photo TEXT,
                email TEXT NOT NULL,
                category TEXT DEFAULT 'digital',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (email) REFERENCES users (email)
            )
        ''')
    
    elif table_name == 'thoughts':
        cursor.execute('''
            CREATE TABLE thoughts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                content TEXT NOT NULL,
                music_url TEXT,
                image_url TEXT,
                clock_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (email) REFERENCES users (email)
            )
        ''')
    
    elif table_name == 'clapbacks':
        cursor.execute('''
            CREATE TABLE clapbacks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thought_id INTEGER NOT NULL,
                email TEXT NOT NULL,
                reply_content TEXT NOT NULL,
                clock_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (thought_id) REFERENCES thoughts (id),
                FOREIGN KEY (email) REFERENCES users (email)
            )
        ''')
    
    elif table_name == 'conversations':
        cursor.execute('''
            CREATE TABLE conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user1_email TEXT NOT NULL,
                user2_email TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_email) REFERENCES users (email),
                FOREIGN KEY (user2_email) REFERENCES users (email)
            )
        ''')
    
    elif table_name == 'messages':
        cursor.execute('''
            CREATE TABLE messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                sender_email TEXT NOT NULL,
                message_content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id),
                FOREIGN KEY (sender_email) REFERENCES users (email)
            )
        ''')
    
    elif table_name == 'clocks':
        cursor.execute('''
            CREATE TABLE clocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (email) REFERENCES users (email),
                UNIQUE(email, target_type, target_id)
            )
        ''')

if __name__ == '__main__':
    migrate_database()
