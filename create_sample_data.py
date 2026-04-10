"""
Create sample data for Glimmer app to make it functional
"""

import sqlite3
import uuid
from datetime import datetime

def create_sample_data():
    """Create sample products, thoughts, and conversations"""
    conn = sqlite3.connect('glimmer.db')
    cursor = conn.cursor()
    
    # Create sample products
    print("Creating sample products...")
    sample_products = [
        ("Vintage Camera", "Classic film camera in excellent condition", "15000", "camera1.jpg", "test@glimmer.com"),
        ("Laptop Pro", "High-performance laptop for development", "45000", "laptop1.jpg", "test@glimmer.com"),
        ("Headphones", "Premium noise-cancelling headphones", "8000", "headphones1.jpg", "test@glimmer.com"),
        ("Smart Watch", "Fitness and health tracking watch", "12000", "watch1.jpg", "test@glimmer.com"),
    ]
    
    for name, desc, cost, photo, email in sample_products:
        cursor.execute("""
            INSERT INTO products (product_name, product_description, product_cost, product_photo, email)
            VALUES (?, ?, ?, ?, ?)
        """, (name, desc, cost, photo, email))
    
    # Create sample thoughts
    print("Creating sample thoughts...")
    sample_thoughts = [
        ("Just launched the new Glimmer app! Excited to see what everyone builds.", "test@glimmer.com"),
        ("Working on some new features for the marketplace. Any suggestions?", "test@glimmer.com"),
        ("The design system needs some love. Thinking about a refresh soon.", "test@glimmer.com"),
    ]
    
    for content, email in sample_thoughts:
        cursor.execute("""
            INSERT INTO thoughts (email, content)
            VALUES (?, ?)
        """, (email, content))
    
    # Create a sample conversation
    print("Creating sample conversation...")
    cursor.execute("""
        INSERT INTO conversations (user1_email, user2_email)
        VALUES (?, ?)
    """, ("test@glimmer.com", "test@glimmer.com"))  # Self-conversation for testing
    
    conv_id = cursor.lastrowid
    
    # Add some messages to the conversation
    sample_messages = [
        ("Welcome to Glimmer! This is a test message.", "test@glimmer.com"),
        ("How are you finding the app so far?", "test@glimmer.com"),
        ("Let me know if you need any help with the features!", "test@glimmer.com"),
    ]
    
    for content, email in sample_messages:
        cursor.execute("""
            INSERT INTO messages (conversation_id, sender_email, message_content)
            VALUES (?, ?, ?)
        """, (conv_id, email, content))
    
    conn.commit()
    conn.close()
    
    print("\n=== SAMPLE DATA CREATED ===")
    print("✅ 3 Sample Products")
    print("✅ 3 Sample Thoughts") 
    print("✅ 1 Sample Conversation with 3 Messages")
    print("\nNow the app should have content to explore!")

if __name__ == '__main__':
    create_sample_data()
