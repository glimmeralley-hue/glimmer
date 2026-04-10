"""
Glimmer Backend Server
Local Flask server with SQLite database and Socket.IO for messaging
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import sqlite3
import os
from datetime import datetime
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'glimmer-secret-key-change-this'
app.config['UPLOAD_FOLDER'] = 'static/images'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Enable CORS for all routes with specific origins
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Database setup
def init_db():
    """Initialize SQLite database with all necessary tables"""
    conn = sqlite3.connect('glimmer.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            profile_pic TEXT DEFAULT 'default.png',
            bio TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
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
    
    # Thoughts/Spills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS thoughts (
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
    
    # Clapbacks (replies) table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clapbacks (
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
    
    # Conversations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user1_email TEXT NOT NULL,
            user2_email TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user1_email) REFERENCES users (email),
            FOREIGN KEY (user2_email) REFERENCES users (email)
        )
    ''')
    
    # Messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_email TEXT NOT NULL,
            message_content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id),
            FOREIGN KEY (sender_email) REFERENCES users (email)
        )
    ''')
    
    # Clocks table (for tracking who clocked what)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            target_type TEXT NOT NULL, -- 'thought' or 'clapback'
            target_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (email) REFERENCES users (email),
            UNIQUE(email, target_type, target_id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Store active users for messaging
active_users = {}

# Helper functions
def get_db_connection():
    conn = sqlite3.connect('glimmer.db')
    conn.row_factory = sqlite3.Row
    return conn

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# API Routes
@app.route('/api/signin', methods=['POST'])
def signin():
    email = request.form.get('email')
    password = request.form.get('password')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ? AND password = ?', 
                       (email, password)).fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'status': 'success',
            'user': dict(user)
        })
    else:
        return jsonify({
            'status': 'error',
            'message': 'Invalid credentials'
        })

@app.route('/api/signup', methods=['POST'])
def signup():
    email = request.form.get('email')
    username = request.form.get('username')
    password = request.form.get('password')
    
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
                   (email, username, password))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Account created successfully'
        })
    except sqlite3.IntegrityError:
        return jsonify({
            'status': 'error',
            'message': 'Email already exists'
        })

@app.route('/api/add_product', methods=['POST'])
def add_product():
    product_name = request.form.get('product_name')
    product_description = request.form.get('product_description')
    product_cost = request.form.get('product_cost')
    email = request.form.get('email')
    product_photo = request.files.get('product_photo')
    
    photo_filename = 'default.png'
    if product_photo and allowed_file(product_photo.filename):
        filename = secure_filename(product_photo.filename)
        photo_filename = f"{uuid.uuid4()}_{filename}"
        
        # Create upload directory if it doesn't exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        product_photo.save(os.path.join(app.config['UPLOAD_FOLDER'], photo_filename))
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO products (product_name, product_description, product_cost, product_photo, email)
        VALUES (?, ?, ?, ?, ?)
    ''', (product_name, product_description, product_cost, photo_filename, email))
    conn.commit()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Product added successfully'
    })

@app.route('/api/get_products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products ORDER BY created_at DESC').fetchall()
    conn.close()
    
    return jsonify([dict(product) for product in products])

@app.route('/api/add_thought', methods=['POST'])
def add_thought():
    email = request.form.get('email')
    content = request.form.get('content')
    music_url = request.form.get('music_url', '')
    image = request.files.get('image')
    
    image_filename = None
    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        image_filename = f"{uuid.uuid4()}_{filename}"
        
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO thoughts (email, content, music_url, image_url)
        VALUES (?, ?, ?, ?)
    ''', (email, content, music_url, image_filename))
    conn.commit()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Thought posted successfully'
    })

@app.route('/api/get_thoughts', methods=['GET'])
def get_thoughts():
    conn = get_db_connection()
    thoughts = conn.execute('''
        SELECT t.*, u.username, u.profile_pic,
               COUNT(c.id) as replies_count
        FROM thoughts t
        JOIN users u ON t.email = u.email
        LEFT JOIN clapbacks c ON t.id = c.thought_id
        GROUP BY t.id
        ORDER BY t.created_at DESC
    ''').fetchall()
    
    # Get replies for each thought
    thoughts_list = []
    for thought in thoughts:
        thought_dict = dict(thought)
        
        # Get clapbacks for this thought
        clapbacks = conn.execute('''
            SELECT cb.*, u.username, u.profile_pic
            FROM clapbacks cb
            JOIN users u ON cb.email = u.email
            WHERE cb.thought_id = ?
            ORDER BY cb.created_at ASC
        ''', (thought['id'],)).fetchall()
        
        thought_dict['replies'] = [dict(cb) for cb in clapbacks]
        thoughts_list.append(thought_dict)
    
    conn.close()
    return jsonify(thoughts_list)

@app.route('/api/toggle_clock', methods=['POST'])
def toggle_clock():
    email = request.form.get('email')
    thought_id = request.form.get('thought_id')
    
    conn = get_db_connection()
    
    # Check if already clocked
    existing = conn.execute(
        'SELECT * FROM clocks WHERE email = ? AND target_type = ? AND target_id = ?',
        (email, 'thought', thought_id)
    ).fetchone()
    
    if existing:
        # Remove clock
        conn.execute('DELETE FROM clocks WHERE email = ? AND target_type = ? AND target_id = ?',
                   (email, 'thought', thought_id))
        action = 'removed'
    else:
        # Add clock
        conn.execute('INSERT INTO clocks (email, target_type, target_id) VALUES (?, ?, ?)',
                   (email, 'thought', thought_id))
        action = 'added'
    
    # Update clock count
    clock_count = conn.execute(
        'SELECT COUNT(*) as count FROM clocks WHERE target_type = ? AND target_id = ?',
        ('thought', thought_id)
    ).fetchone()['count']
    
    conn.execute('UPDATE thoughts SET clock_count = ? WHERE id = ?', (clock_count, thought_id))
    conn.commit()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'action': action,
        'clock_count': clock_count
    })

@app.route('/api/add_clapback', methods=['POST'])
def add_clapback():
    thought_id = request.form.get('thought_id')
    email = request.form.get('email')
    content = request.form.get('content')
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO clapbacks (thought_id, email, reply_content)
        VALUES (?, ?, ?)
    ''', (thought_id, email, content))
    conn.commit()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Reply added successfully'
    })

@app.route('/api/delete_thought', methods=['POST'])
def delete_thought():
    thought_id = request.form.get('id')
    email = request.form.get('email')
    
    conn = get_db_connection()
    
    # Verify ownership
    thought = conn.execute('SELECT email FROM thoughts WHERE id = ?', (thought_id,)).fetchone()
    if thought and thought['email'] == email:
        conn.execute('DELETE FROM thoughts WHERE id = ?', (thought_id,))
        conn.execute('DELETE FROM clapbacks WHERE thought_id = ?', (thought_id,))
        conn.commit()
        result = {'status': 'success'}
    else:
        result = {'status': 'error', 'message': 'Unauthorized'}
    
    conn.close()
    return jsonify(result)

@app.route('/api/delete_clapback', methods=['POST'])
def delete_clapback():
    clapback_id = request.form.get('id')
    email = request.form.get('email')
    
    conn = get_db_connection()
    
    # Verify ownership or thought ownership
    clapback = conn.execute('''
        SELECT c.email, t.email as thought_email 
        FROM clapbacks c 
        JOIN thoughts t ON c.thought_id = t.id 
        WHERE c.id = ?
    ''', (clapback_id,)).fetchone()
    
    if clapback and (clapback['email'] == email or clapback['thought_email'] == email):
        conn.execute('DELETE FROM clapbacks WHERE id = ?', (clapback_id,))
        conn.commit()
        result = {'status': 'success'}
    else:
        result = {'status': 'error', 'message': 'Unauthorized'}
    
    conn.close()
    return jsonify(result)

# Messaging endpoints
@app.route('/api/get_conversations/<email>')
def get_conversations(email):
    conn = get_db_connection()
    conversations = conn.execute('''
        SELECT c.*, 
               u1.username as user1_name, u1.profile_pic as user1_pic,
               u2.username as user2_name, u2.profile_pic as user2_pic,
               (SELECT message_content FROM messages 
                WHERE conversation_id = c.id 
                ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages 
                WHERE conversation_id = c.id 
                ORDER BY created_at DESC LIMIT 1) as last_message_time
        FROM conversations c
        JOIN users u1 ON c.user1_email = u1.email
        JOIN users u2 ON c.user2_email = u2.email
        WHERE c.user1_email = ? OR c.user2_email = ?
        ORDER BY last_message_time DESC
    ''', (email, email)).fetchall()
    
    conversations_list = []
    for conv in conversations:
        conv_dict = dict(conv)
        
        # Determine other user info
        if conv['user1_email'] == email:
            conv_dict['other_user_email'] = conv['user2_email']
            conv_dict['other_user_name'] = conv['user2_name']
            conv_dict['other_user_pic'] = conv['user2_pic']
        else:
            conv_dict['other_user_email'] = conv['user1_email']
            conv_dict['other_user_name'] = conv['user1_name']
            conv_dict['other_user_pic'] = conv['user1_pic']
        
        conversations_list.append(conv_dict)
    
    conn.close()
    return jsonify(conversations_list)

@app.route('/api/get_messages/<conversation_id>')
def get_messages(conversation_id):
    conn = get_db_connection()
    messages = conn.execute('''
        SELECT m.*, u.username, u.profile_pic
        FROM messages m
        JOIN users u ON m.sender_email = u.email
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
    ''', (conversation_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(msg) for msg in messages])

@app.route('/api/send_message', methods=['POST'])
def send_message():
    conversation_id = request.form.get('conversation_id')
    sender_email = request.form.get('sender_email')
    message_content = request.form.get('message_content')
    
    conn = get_db_connection()
    cursor = conn.execute('''
        INSERT INTO messages (conversation_id, sender_email, message_content)
        VALUES (?, ?, ?)
    ''', (conversation_id, sender_email, message_content))
    
    message_id = cursor.lastrowid
    conn.commit()
    
    # Get the message with user info
    message = conn.execute('''
        SELECT m.*, u.username, u.profile_pic
        FROM messages m
        JOIN users u ON m.sender_email = u.email
        WHERE m.id = ?
    ''', (message_id,)).fetchone()
    
    conn.close()
    
    # Emit real-time message via Socket.IO
    socketio.emit('receive_message', {
        'conversation_id': conversation_id,
        'message': dict(message)
    }, room=f"conversation_{conversation_id}")
    
    return jsonify({
        'success': True,
        'message': dict(message)
    })

@app.route('/api/create_conversation', methods=['POST'])
def create_conversation():
    user1_email = request.form.get('user1_email')
    user2_email = request.form.get('user2_email')
    
    conn = get_db_connection()
    
    # Check if conversation already exists
    existing = conn.execute('''
        SELECT id FROM conversations 
        WHERE (user1_email = ? AND user2_email = ?) 
        OR (user1_email = ? AND user2_email = ?)
    ''', (user1_email, user2_email, user2_email, user1_email)).fetchone()
    
    if existing:
        result = {'status': 'exists', 'conversation_id': existing['id']}
    else:
        cursor = conn.execute('''
            INSERT INTO conversations (user1_email, user2_email)
            VALUES (?, ?)
        ''', (user1_email, user2_email))
        conn.commit()
        result = {'status': 'success', 'conversation_id': cursor.lastrowid}
    
    conn.close()
    return jsonify(result)

@app.route('/api/get_unread_count/<email>')
def get_unread_count(email):
    # This is a simplified version - you'd implement proper unread tracking
    return jsonify({'count': 0})

@app.route('/api/get_profile/<email>')
def get_profile(email):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    if user:
        return jsonify(dict(user))
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/api/update_profile', methods=['POST'])
def update_profile():
    email = request.form.get('email')
    bio = request.form.get('bio', '')
    phone = request.form.get('phone', '')
    profile_pic = request.files.get('profile_pic')
    
    conn = get_db_connection()
    
    # Handle profile picture upload
    if profile_pic and allowed_file(profile_pic.filename):
        filename = secure_filename(profile_pic.filename)
        pic_filename = f"{uuid.uuid4()}_{filename}"
        
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        profile_pic.save(os.path.join(app.config['UPLOAD_FOLDER'], pic_filename))
        
        conn.execute('UPDATE users SET profile_pic = ?, bio = ?, phone = ? WHERE email = ?',
                   (pic_filename, bio, phone, email))
    else:
        conn.execute('UPDATE users SET bio = ?, phone = ? WHERE email = ?',
                   (bio, phone, email))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Profile updated successfully'
    })

# Serve static files with CORS support
@app.route('/static/images/<filename>')
def serve_image(filename):
    response = send_from_directory('static/images', filename)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# Socket.IO events
@socketio.on('connect')
def on_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def on_disconnect():
    print(f"Client disconnected: {request.sid}")
    
    # Remove user from active users
    user_email = None
    for email, sid in active_users.items():
        if sid == request.sid:
            user_email = email
            break
    
    if user_email and user_email in active_users:
        del active_users[user_email]
    
    emit('user_status', {'email': user_email, 'status': 'offline'}, broadcast=True)

@socketio.on('join_user')
def on_join_user(data):
    user_email = data.get('email')
    if user_email:
        active_users[user_email] = request.sid
        print(f"User {user_email} joined with socket {request.sid}")
        
        emit('user_status', {'email': user_email, 'status': 'online'}, broadcast=True)
        emit('online_users', {'users': list(active_users.keys())})

@socketio.on('send_message')
def on_send_message(data):
    conversation_id = data.get('conversation_id')
    message = data.get('message')
    recipient_email = data.get('recipient_email')
    
    print(f"Message sent in conversation {conversation_id} to {recipient_email}")
    
    # Send to recipient if they're online
    if recipient_email in active_users:
        recipient_socket_id = active_users[recipient_email]
        emit('receive_message', {
            'conversation_id': conversation_id,
            'message': message
        }, room=recipient_socket_id)

@socketio.on('join_conversation')
def on_join_conversation(data):
    conversation_id = data.get('conversation_id')
    room = f"conversation_{conversation_id}"
    join_room(room)
    print(f"Joined room: {room}")

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Create static directory if it doesn't exist
    os.makedirs('static/images', exist_ok=True)
    
    print("Glimmer server starting on http://localhost:5000")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
