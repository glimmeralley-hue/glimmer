const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/static/images', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feed');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payment');
const messageRoutes = require('./routes/messages');
const productRoutes = require('./routes/products');

// Use routes
app.use('/api', authRoutes);
app.use('/api', feedRoutes);
app.use('/api', profileRoutes);
app.use('/api', paymentRoutes);
app.use('/api', messageRoutes);
app.use('/api', productRoutes);

// Socket.io setup
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ["GET", "POST"]
  }
});

// Socket connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_user', (email) => {
    connectedUsers.set(email, socket.id);
    socket.email = email;
    console.log(`User ${email} joined with socket ${socket.id}`);
  });

  socket.on('send_message', (data) => {
    const { recipient_email, conversation_id, message } = data;
    const recipientSocket = connectedUsers.get(recipient_email);
    
    if (recipientSocket) {
      io.to(recipientSocket).emit('receive_message', {
        conversation_id,
        message
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.email) {
      connectedUsers.delete(socket.email);
      console.log(`User ${socket.email} disconnected`);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Route not found' 
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Glimmer backend server running on port ${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'uploads')}`);
});

module.exports = { app, io };
