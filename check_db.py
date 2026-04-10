import sqlite3

def check_database():
    """Check what's actually in the database"""
    conn = sqlite3.connect('glimmer.db')
    cursor = conn.cursor()
    
    print("=== USERS TABLE ===")
    cursor.execute("SELECT email, username, created_at FROM users")
    users = cursor.fetchall()
    for user in users:
        print(f"  - {user[0]} ({user[1]}) - Created: {user[2]}")
    
    print(f"\n=== PRODUCTS TABLE ===")
    cursor.execute("SELECT id, product_name, email, created_at FROM products")
    products = cursor.fetchall()
    print(f"Total products: {len(products)}")
    for product in products:
        print(f"  - {product[1]} by {product[2]} - ID: {product[0]}")
    
    print(f"\n=== THOUGHTS TABLE ===")
    cursor.execute("SELECT id, email, content, created_at FROM thoughts")
    thoughts = cursor.fetchall()
    print(f"Total thoughts: {len(thoughts)}")
    for thought in thoughts[:3]:  # Show first 3
        print(f"  - {thought[1][:50]}... by {thought[2]}")
    
    print(f"\n=== CONVERSATIONS TABLE ===")
    cursor.execute("SELECT id, user1_email, user2_email FROM conversations")
    conversations = cursor.fetchall()
    print(f"Total conversations: {len(conversations)}")
    for conv in conversations:
        print(f"  - {conv[0]}: {conv[1]} ↔ {conv[2]}")
    
    conn.close()

if __name__ == '__main__':
    check_database()
