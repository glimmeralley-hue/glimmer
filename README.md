# Glimmer

A modern social media and marketplace application built with React and Flask.

## Features

- **Social Feed**: Post thoughts (spills), images, and music
- **Real-time Messaging**: WebSocket-based chat system
- **Marketplace**: Buy and sell products
- **User Profiles**: Customizable user profiles
- **Clock System**: Like/interact with posts and replies

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- npm or yarn

### Quick Start (Recommended)

**Windows Users:**
```bash
setup_and_start.bat
```

**Manual Setup:**

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run database migration:**
   ```bash
   python migrate_db.py
   ```

3. **Start the backend server:**
   ```bash
   python app.py
   ```
   
   The backend will start on `http://localhost:5000`

4. **Install Node.js dependencies (first time only):**
   ```bash
   npm install
   ```

5. **Start the React app:**
   ```bash
   npm start
   ```
   
   The frontend will start on `http://localhost:3000`

### Database

The app uses SQLite for local development. The database (`glimmer.db`) will be automatically created when you start the backend server.

### API Endpoints

- `POST /api/signin` - User authentication
- `POST /api/signup` - User registration
- `GET /api/get_thoughts` - Get social feed
- `POST /api/add_thought` - Post a new thought
- `GET /api/get_products` - Get marketplace products
- `POST /api/add_product` - Add a new product
- `GET /api/get_conversations/<email>` - Get user conversations
- `POST /api/send_message` - Send a message

### Socket.IO Events

- `connect` - Client connects to server
- `join_user` - User joins messaging system
- `send_message` - Send real-time message
- `receive_message` - Receive real-time message

## Development

The app is configured to use a local development server by default. All API calls will be routed to `http://localhost:5000` in development mode.

## File Structure

```
glimmer/
  src/
    components/     # React components
    config/         # API configuration
  static/
    images/         # User uploaded images
  app.py           # Flask backend server
  requirements.txt # Python dependencies
  glimmer.db       # SQLite database (auto-generated)
```

## Troubleshooting

- **Backend not starting**: Make sure Python 3.8+ is installed and all requirements are met
- **Frontend not connecting**: Ensure the backend is running on port 5000 before starting the frontend
- **Database errors**: Delete `glimmer.db` and restart the backend to recreate the database
