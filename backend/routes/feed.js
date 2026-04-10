const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get thoughts/feed
router.get('/get_thoughts', async (req, res) => {
  try {
    const [thoughts] = await pool.execute(`
      SELECT 
        t.id,
        t.content,
        t.image_url,
        t.music_url,
        t.clock_count,
        t.created_at,
        u.username,
        u.email as user_email,
        u.profile_pic,
        (SELECT COUNT(*) FROM replies r WHERE r.thought_id = t.id) as reply_count,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', r.id,
            'reply_content', r.reply_content,
            'clock_count', r.clock_count,
            'created_at', r.created_at,
            'user_email', r.user_email,
            'username', ru.username,
            'profile_pic', ru.profile_pic
          )
        ) FROM replies r 
        LEFT JOIN users ru ON r.user_email = ru.email 
        WHERE r.thought_id = t.id) as replies
      FROM thoughts t
      LEFT JOIN users u ON t.user_email = u.email
      ORDER BY t.created_at DESC
      LIMIT 50
    `);

    res.json(thoughts);

  } catch (error) {
    console.error('Get thoughts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch thoughts'
    });
  }
});

// Add thought
router.post('/add_thought', upload.single('image'), [
  body('email').isEmail().withMessage('Valid email required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { email, content, music_url } = req.body;
    const image_url = req.file ? req.file.filename : null;

    // Verify user exists
    const [users] = await pool.execute(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Insert thought
    const [result] = await pool.execute(
      'INSERT INTO thoughts (user_email, content, image_url, music_url) VALUES (?, ?, ?, ?)',
      [email, content, image_url, music_url || null]
    );

    res.status(201).json({
      status: 'success',
      message: 'Thought posted successfully',
      thought_id: result.insertId
    });

  } catch (error) {
    console.error('Add thought error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to post thought'
    });
  }
});

// Toggle clock (like/unlike)
router.post('/toggle_clock', [
  body('thought_id').isInt().withMessage('Valid thought ID required'),
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { thought_id, email } = req.body;

    // Check if user already clocked this thought
    const [existingClocks] = await pool.execute(
      'SELECT id FROM clocks WHERE thought_id = ? AND user_email = ?',
      [thought_id, email]
    );

    if (existingClocks.length > 0) {
      // Remove clock
      await pool.execute(
        'DELETE FROM clocks WHERE thought_id = ? AND user_email = ?',
        [thought_id, email]
      );
      
      await pool.execute(
        'UPDATE thoughts SET clock_count = clock_count - 1 WHERE id = ?',
        [thought_id]
      );
    } else {
      // Add clock
      await pool.execute(
        'INSERT INTO clocks (thought_id, user_email) VALUES (?, ?)',
        [thought_id, email]
      );
      
      await pool.execute(
        'UPDATE thoughts SET clock_count = clock_count + 1 WHERE id = ?',
        [thought_id]
      );
    }

    res.json({
      status: 'success',
      message: existingClocks.length > 0 ? 'Clock removed' : 'Clock added'
    });

  } catch (error) {
    console.error('Toggle clock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle clock'
    });
  }
});

// Add reply/clapback
router.post('/add_clapback', [
  body('thought_id').isInt().withMessage('Valid thought ID required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { thought_id, email, content } = req.body;

    // Verify user exists
    const [users] = await pool.execute(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Insert reply
    const [result] = await pool.execute(
      'INSERT INTO replies (thought_id, user_email, reply_content) VALUES (?, ?, ?)',
      [thought_id, email, content]
    );

    res.status(201).json({
      status: 'success',
      message: 'Reply added successfully',
      reply_id: result.insertId
    });

  } catch (error) {
    console.error('Add clapback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add reply'
    });
  }
});

// Delete thought
router.post('/delete_thought', [
  body('id').isInt().withMessage('Valid thought ID required'),
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { id, email } = req.body;

    // Verify thought belongs to user
    const [thoughts] = await pool.execute(
      'SELECT user_email FROM thoughts WHERE id = ?',
      [id]
    );

    if (thoughts.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Thought not found'
      });
    }

    if (thoughts[0].user_email !== email) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this thought'
      });
    }

    // Delete thought (cascades will delete related clocks and replies)
    await pool.execute(
      'DELETE FROM thoughts WHERE id = ?',
      [id]
    );

    res.json({
      status: 'success',
      message: 'Thought deleted successfully'
    });

  } catch (error) {
    console.error('Delete thought error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete thought'
    });
  }
});

// Delete clapback
router.post('/delete_clapback', [
  body('id').isInt().withMessage('Valid reply ID required'),
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { id, email } = req.body;

    // Verify reply belongs to user
    const [replies] = await pool.execute(
      'SELECT r.user_email, t.user_email as thought_author FROM replies r 
       LEFT JOIN thoughts t ON r.thought_id = t.id WHERE r.id = ?',
      [id]
    );

    if (replies.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Reply not found'
      });
    }

    const reply = replies[0];
    if (reply.user_email !== email && reply.thought_author !== email) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this reply'
      });
    }

    // Delete reply
    await pool.execute(
      'DELETE FROM replies WHERE id = ?',
      [id]
    );

    res.json({
      status: 'success',
      message: 'Reply deleted successfully'
    });

  } catch (error) {
    console.error('Delete clapback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete reply'
    });
  }
});

module.exports = router;
