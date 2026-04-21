"""
WebSocket Server for Glimmer Messaging
This is an example implementation that you can integrate with your passenger_wsgi.py
"""

from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import Flask
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'glimmer-secret-key-change-this'

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Store active users and their socket IDs
active_users = {}
user_rooms = {}  # user_email -> socket_id

@socketio.on('connect')
def on_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def on_disconnect():
    print(f"Client disconnected: {request.sid}")
    
    # Remove user from active users
    user_email = None
    for email, sid in user_rooms.items():
        if sid == request.sid:
            user_email = email
            break
    
    if user_email and user_email in user_rooms:
        del user_rooms[user_email]
    
    # Notify other users that this user is offline
    emit('user_status', {'email': user_email, 'status': 'offline'}, broadcast=True)

@socketio.on('join_user')
def on_join_user(data):
    user_email = data.get('email')
    if user_email:
        user_rooms[user_email] = request.sid
        print(f"User {user_email} joined with socket {request.sid}")
        
        # Notify other users that this user is online
        emit('user_status', {'email': user_email, 'status': 'online'}, broadcast=True)
        
        # Send list of online users to the newly connected user
        online_users = list(user_rooms.keys())
        emit('online_users', {'users': online_users})

@socketio.on('send_message')
def on_send_message(data):
    conversation_id = data.get('conversation_id')
    message = data.get('message')
    recipient_email = data.get('recipient_email')
    
    print(f"Message sent in conversation {conversation_id} to {recipient_email}")
    
    # Here you would typically:
    # 1. Save the message to your database
    # 2. Get the recipient's socket ID from user_rooms
    # 3. Send the message to the recipient
    
    # Send to recipient if they're online
    if recipient_email in user_rooms:
        recipient_socket_id = user_rooms[recipient_email]
        emit('receive_message', {
            'conversation_id': conversation_id,
            'message': message,
            'sender_email': data.get('sender_email')
        }, room=recipient_socket_id)
    
    # Broadcast to all connected users in the conversation (for group chats)
    # For now, we'll just broadcast to everyone except sender
    emit('receive_message', {
        'conversation_id': conversation_id,
        'message': message,
        'sender_email': data.get('sender_email')
    }, broadcast=True, include_self=False)

@socketio.on('typing')
def on_typing(data):
    conversation_id = data.get('conversation_id')
    recipient_email = data.get('recipient_email')
    is_typing = data.get('is_typing', False)
    sender_email = data.get('sender_email')
    
    print(f"Typing indicator: {sender_email} is {'typing' if is_typing else 'not typing'} in conversation {conversation_id}")
    
    # Send typing indicator to recipient
    if recipient_email in user_rooms:
        recipient_socket_id = user_rooms[recipient_email]
        emit('typing', {
            'conversation_id': conversation_id,
            'sender_email': sender_email,
            'is_typing': is_typing
        }, room=recipient_socket_id)

@socketio.on('join_conversation')
def on_join_conversation(data):
    conversation_id = data.get('conversation_id')
    user_email = data.get('user_email')
    
    # Join a room for this conversation
    room = f"conversation_{conversation_id}"
    join_room(room)
    
    print(f"User {user_email} joined conversation room {room}")

@socketio.on('leave_conversation')
def on_leave_conversation(data):
    conversation_id = data.get('conversation_id')
    user_email = data.get('user_email')
    
    # Leave the room for this conversation
    room = f"conversation_{conversation_id}"
    leave_room(room)
    
    print(f"User {user_email} left conversation room {room}")

# API Endpoints for your existing backend
@app.route('/api/get_conversations/<email>')
def get_conversations(email):
    # Your existing conversation fetching logic
    # This should return a list of conversations with last_message, etc.
    pass

@app.route('/api/get_messages/<conversation_id>')
def get_messages(conversation_id):
    # Your existing message fetching logic
    # This should return a list of messages for the conversation
    pass

@app.route('/api/send_message', methods=['POST'])
def send_message():
    # Your existing message sending logic
    # After saving to database, you can emit the message via WebSocket
    conversation_id = request.form.get('conversation_id')
    sender_email = request.form.get('sender_email')
    message_content = request.form.get('message_content')
    
    # Save to database (your existing logic)
    
    # Emit real-time message
    message_data = {
        'id': new_message_id,
        'conversation_id': conversation_id,
        'sender_email': sender_email,
        'message_content': message_content,
        'created_at': datetime.now().isoformat()
    }
    
    # Get recipient from conversation and send
    recipient_email = get_recipient_from_conversation(conversation_id, sender_email)
    
    if recipient_email in user_rooms:
        recipient_socket_id = user_rooms[recipient_email]
        socketio.emit('receive_message', {
            'conversation_id': conversation_id,
            'message': message_data
        }, room=recipient_socket_id)
    
    return jsonify({'success': True, 'message': message_data})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
