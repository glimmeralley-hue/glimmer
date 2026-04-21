const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const router = express.Router();

// Get conversations for a user
router.get('/get_conversations/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Get all conversations where user is involved
    const [conversations] = await pool.execute(`
      SELECT 
        c.id,
        c.user1_email,
        c.user2_email,
        c.created_at,
        CASE 
          WHEN c.user1_email = ? THEN u2.username
          ELSE u1.username
        END as other_user_name,
        CASE 
          WHEN c.user1_email = ? THEN u2.email
          ELSE u1.email
        END as other_user_email,
        CASE 
          WHEN c.user1_email = ? THEN u2.profile_pic
          ELSE u1.profile_pic
        END as profile_pic,
        (SELECT m.message_content FROM messages m 
         WHERE m.conversation_id = c.id 
         ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM messages m 
         WHERE m.conversation_id = c.id 
         ORDER BY m.created_at DESC LIMIT 1) as last_message_time
      FROM conversations c
      LEFT JOIN users u1 ON c.user1_email = u1.email
      LEFT JOIN users u2 ON c.user2_email = u2.email
      WHERE c.user1_email = ? OR c.user2_email = ?
      ORDER BY last_message_time DESC NULLS LAST, c.created_at DESC
    `, [email, email, email, email, email]);

    res.json(conversations);

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversations'
    });
  }
});

// Get messages for a conversation
router.get('/get_messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists
    const [conversations] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    // Get messages
    const [messages] = await pool.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_email,
        m.message_content,
        m.created_at,
        u.username,
        u.profile_pic
      FROM messages m
      LEFT JOIN users u ON m.sender_email = u.email
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [conversationId]);

    res.json(messages);

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    });
  }
});

// Send message
router.post('/send_message', [
  body('conversation_id').isInt().withMessage('Valid conversation ID required'),
  body('sender_email').isEmail().withMessage('Valid sender email required'),
  body('message_content').trim().isLength({ min: 1 }).withMessage('Message cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { conversation_id, sender_email, message_content } = req.body;

    // Verify conversation exists and user is part of it
    const [conversations] = await pool.execute(
      'SELECT user1_email, user2_email FROM conversations WHERE id = ?',
      [conversation_id]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    const conversation = conversations[0];
    if (conversation.user1_email !== sender_email && conversation.user2_email !== sender_email) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to send message in this conversation'
      });
    }

    // Insert message
    const [result] = await pool.execute(
      'INSERT INTO messages (conversation_id, sender_email, message_content) VALUES (?, ?, ?)',
      [conversation_id, sender_email, message_content]
    );

    // Get the inserted message with user details
    const [newMessage] = await pool.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_email,
        m.message_content,
        m.created_at,
        u.username,
        u.profile_pic
      FROM messages m
      LEFT JOIN users u ON m.sender_email = u.email
      WHERE m.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: newMessage[0]
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Create conversation
router.post('/create_conversation', [
  body('user1_email').isEmail().withMessage('Valid user1 email required'),
  body('user2_email').isEmail().withMessage('Valid user2 email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { user1_email, user2_email } = req.body;

    // Prevent self-conversation
    if (user1_email === user2_email) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot create conversation with yourself'
      });
    }

    // Verify both users exist
    const [users] = await pool.execute(
      'SELECT email FROM users WHERE email IN (?, ?)',
      [user1_email, user2_email]
    );

    if (users.length < 2) {
      return res.status(404).json({
        status: 'error',
        message: 'One or both users not found'
      });
    }

    // Check if conversation already exists
    const [existingConversations] = await pool.execute(
      'SELECT id FROM conversations WHERE (user1_email = ? AND user2_email = ?) OR (user1_email = ? AND user2_email = ?)',
      [user1_email, user2_email, user2_email, user1_email]
    );

    if (existingConversations.length > 0) {
      return res.json({
        status: 'exists',
        message: 'Conversation already exists',
        conversation_id: existingConversations[0].id
      });
    }

    // Create new conversation
    const [result] = await pool.execute(
      'INSERT INTO conversations (user1_email, user2_email) VALUES (?, ?)',
      [user1_email, user2_email]
    );

    res.status(201).json({
      status: 'success',
      message: 'Conversation created successfully',
      conversation_id: result.insertId
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create conversation'
    });
  }
});

// Delete conversation (optional - for future use)
router.delete('/delete_conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userEmail = req.headers['user-email'];

    if (!userEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'User email required'
      });
    }

    // Verify conversation exists and user is part of it
    const [conversations] = await pool.execute(
      'SELECT user1_email, user2_email FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    const conversation = conversations[0];
    if (conversation.user1_email !== userEmail && conversation.user2_email !== userEmail) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this conversation'
      });
    }

    // Delete conversation (cascades will delete messages)
    await pool.execute(
      'DELETE FROM conversations WHERE id = ?',
      [conversationId]
    );

    res.json({
      status: 'success',
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete conversation'
    });
  }
});

module.exports = router;
