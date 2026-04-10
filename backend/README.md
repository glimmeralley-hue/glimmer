# Glimmer Backend API

A comprehensive backend API for the Glimmer social media application, built with Node.js, Express, and MySQL.

## Features

- **Authentication**: User registration and login with JWT
- **Content Management**: Post thoughts with images and music
- **Profile Management**: Update user profiles with image uploads
- **Payment Processing**: M-Pesa integration for product purchases
- **Real-time Messaging**: WebSocket-based messaging system
- **Product Marketplace**: Asset/product management system

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/signin` - User login
- `GET /api/verify` - Token verification

### Feed/Content
- `GET /api/get_thoughts` - Fetch all thoughts/posts
- `POST /api/add_thought` - Create new thought (with optional image/music)
- `POST /api/toggle_clock` - Like/unlike a thought
- `POST /api/add_clapback` - Add reply to thought
- `POST /api/delete_thought` - Delete a thought
- `POST /api/delete_clapback` - Delete a reply

### Profile Management
- `GET /api/get_profile/:email` - Get user profile
- `POST /api/update_profile` - Update profile (with optional image)
- `GET /api/search_users` - Search users by username/email

### Payment Processing
- `POST /api/mpesa_payment` - Initiate M-Pesa payment
- `GET /api/check_payment/:checkoutRequestID` - Check payment status
- `POST /api/mpesa-callback` - M-Pesa callback endpoint

### Messaging
- `GET /api/get_conversations/:email` - Get user conversations
- `GET /api/get_messages/:conversationId` - Get conversation messages
- `POST /api/send_message` - Send message
- `POST /api/create_conversation` - Create new conversation

### Products
- `GET /api/get_products` - Get all products
- `GET /api/get_product/:id` - Get single product
- `POST /api/add_product` - Add product (admin)
- `PUT /api/update_product/:id` - Update product (admin)
- `DELETE /api/delete_product/:id` - Delete product (admin)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- M-Pesa developer account (for payments)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

5. Set up the database:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

6. Create uploads directory:
   ```bash
   mkdir uploads
   ```

7. Start the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=glimmer_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa-callback

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `thoughts` - User posts/thoughts
- `clocks` - Likes on thoughts
- `replies` - Replies to thoughts
- `products` - Marketplace products
- `payments` - Payment transactions
- `conversations` - Chat conversations
- `messages` - Chat messages

## File Uploads

- Profile pictures and post images are stored in the `uploads/` directory
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, GIF
- Files are accessible via `/static/images/` endpoint

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention

## WebSocket Events

### Client to Server
- `join_user` - User joins with email
- `send_message` - Send message to recipient

### Server to Client
- `receive_message` - Receive incoming message

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Development Notes

- The server runs on port 5000 by default
- Static files are served from the uploads directory
- Database connection pooling is configured for performance
- Comprehensive error logging is implemented

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure proper HTTPS
4. Set up proper CORS origins
5. Use a production database
6. Configure proper file storage (S3, etc.)
7. Set up proper M-Pesa production credentials

## API Testing

You can test the API using tools like Postman or curl. Example:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","phone":"254123456789"}'
```

## License

MIT License
