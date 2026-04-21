"""
Create a test user in the Glimmer database for testing
"""

import sqlite3
import hashlib

def create_test_user():
    """Create a test user for development"""
    conn = sqlite3.connect('glimmer.db')
    cursor = conn.cursor()
    
    # Check if test user already exists
    cursor.execute("SELECT * FROM users WHERE email = ?", ("test@glimmer.com",))
    existing_user = cursor.fetchone()
    
    if existing_user:
        print("Test user already exists!")
        print(f"Email: test@glimmer.com")
        print(f"Password: test123")
        return
    
    # Create test user
    cursor.execute("""
        INSERT INTO users (email, username, password, profile_pic, bio, phone)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        "test@glimmer.com",
        "TestUser",
        "test123",  # Plain text password for testing
        "default.png",
        "Test user for development",
        "+1234567890"
    ))
    
    conn.commit()
    conn.close()
    
    print("Test user created successfully!")
    print("Login credentials:")
    print("Email: test@glimmer.com")
    print("Password: test123")

def list_all_users():
    """List all users in the database"""
    conn = sqlite3.connect('glimmer.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT email, username, created_at FROM users")
    users = cursor.fetchall()
    
    print(f"\nTotal users in database: {len(users)}")
    for user in users:
        print(f"- {user[0]} ({user[1]}) - Created: {user[2]}")
    
    conn.close()

if __name__ == '__main__':
    print("=== Glimmer Test User Creator ===")
    list_all_users()
    print("\nCreating test user...")
    create_test_user()
    list_all_users()
