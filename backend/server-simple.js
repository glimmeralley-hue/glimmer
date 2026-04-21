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

// In-memory storage for demo (replace with database later)
const users = [];
const thoughts = [];
const conversations = [];
const messages = [];

// Mock auth endpoints
app.post('/api/signup', (req, res) => {
  const { username, email, password, phone } = req.body;
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({
      status: 'error',
      message: 'Email already registered'
    });
  }
  
  const newUser = {
    id: users.length + 1,
    username,
    email,
    phone,
    profile_pic: 'default.png',
    created_at: new Date()
  };
  
  users.push(newUser);
  
  res.status(201).json({
    status: 'success',
    message: 'Account created successfully',
    user: newUser
  });
});

app.post('/api/signin', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid email or password'
    });
  }
  
  // Mock token (in real app, use JWT)
  const token = 'mock-token-' + Date.now();
  
  res.json({
    status: 'success',
    message: 'Login successful',
    token,
    user
  });
});

// Mock feed endpoints
app.get('/api/get_thoughts', (req, res) => {
  res.json(thoughts);
});

app.post('/api/add_thought', (req, res) => {
  const { email, content, music_url } = req.body;
  
  const newThought = {
    id: thoughts.length + 1,
    user_email: email,
    content,
    music_url,
    clock_count: 0,
    created_at: new Date(),
    replies: []
  };
  
  thoughts.unshift(newThought);
  
  res.status(201).json({
    status: 'success',
    message: 'Thought posted successfully',
    thought_id: newThought.id
  });
});

app.post('/api/toggle_clock', (req, res) => {
  const { thought_id, email } = req.body;
  
  const thought = thoughts.find(t => t.id === parseInt(thought_id));
  if (thought) {
    thought.clock_count = (thought.clock_count || 0) + 1;
  }
  
  res.json({
    status: 'success',
    message: 'Clock added'
  });
});

// Mock profile endpoints
app.get('/api/get_profile/:email', (req, res) => {
  const { email } = req.params;
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  }
  
  res.json({
    ...user,
    thoughts_count: thoughts.filter(t => t.user_email === email).length,
    total_clocks: thoughts.filter(t => t.user_email === email).reduce((sum, t) => sum + (t.clock_count || 0), 0)
  });
});

// Mock messaging endpoints
app.get('/api/get_conversations/:email', (req, res) => {
  const { email } = req.params;
  const userConversations = conversations.filter(c => c.user1_email === email || c.user2_email === email);
  res.json(userConversations);
});

app.post('/api/send_message', (req, res) => {
  const { conversation_id, sender_email, message_content } = req.body;
  
  const newMessage = {
    id: messages.length + 1,
    conversation_id: parseInt(conversation_id),
    sender_email,
    message_content,
    created_at: new Date()
  };
  
  messages.push(newMessage);
  
  res.status(201).json({
    success: true,
    message: newMessage
  });
});

// Mock products endpoint
app.get('/api/get_products', (req, res) => {
  res.json([
    {
      id: 1,
      product_name: 'Glimmer Pro',
      product_description: 'Premium social media experience',
      product_cost: 299.99,
      product_photo: 'product1.jpg'
    },
    {
      id: 2,
      product_name: 'Glimmer Basic',
      product_description: 'Starter pack for new users',
      product_cost: 99.99,
      product_photo: 'product2.jpg'
    }
  ]);
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

app.listen(PORT, () => {
  console.log(`\n`);
  console.log(`\ud83d\ude80 Glimmer backend server running on port ${PORT}`);
  console.log(`\ud83d\udccd Local: http://localhost:${PORT}`);
  console.log(`\ud83d\udcc1 Static files: ${path.join(__dirname, 'uploads')}`);
  console.log(`\ud83d\udcdd API Documentation:`);
  console.log(`   POST /api/signup - User registration`);
  console.log(`   POST /api/signin - User login`);
  console.log(`   GET  /api/get_thoughts - Fetch feed`);
  console.log(`   POST /api/add_thought - Create post`);
  console.log(`   GET  /api/get_profile/:email - Get profile`);
  console.log(`   GET  /api/get_products - Get products`);
  console.log(`\n`);
  console.log(`\u2705 Server is ready for testing!`);
});

module.exports = app;
