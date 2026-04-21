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
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
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

// Get profile by email
router.get('/get_profile/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const [users] = await pool.execute(
      'SELECT username, email, phone, bio, profile_pic, created_at FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = users[0];

    // Get user's thoughts count
    const [thoughtsCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM thoughts WHERE user_email = ?',
      [email]
    );

    // Get user's total clocks received
    const [totalClocks] = await pool.execute(
      'SELECT SUM(t.clock_count) as total_clocks FROM thoughts t WHERE t.user_email = ?',
      [email]
    );

    const profileData = {
      ...user,
      thoughts_count: thoughtsCount[0].count,
      total_clocks: totalClocks[0].total_clocks || 0
    };

    res.json(profileData);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
});

// Update profile (with optional image upload)
router.post('/update_profile', upload.single('image'), [
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

    const { email, phone, bio } = req.body;
    const imageFile = req.file;

    // Verify user exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    let updateQuery = 'UPDATE users SET phone = ?, bio = ?';
    let updateParams = [phone || null, bio || null];

    // Add image to update if provided
    if (imageFile) {
      updateQuery += ', profile_pic = ?';
      updateParams.push(imageFile.filename);
    }

    updateQuery += ' WHERE email = ?';
    updateParams.push(email);

    await pool.execute(updateQuery, updateParams);

    // Get updated user data
    const [updatedUser] = await pool.execute(
      'SELECT username, email, phone, bio, profile_pic FROM users WHERE email = ?',
      [email]
    );

    const response = {
      status: 'success',
      message: 'Profile updated successfully',
      user: updatedUser[0]
    };

    // Include profile_pic in response if image was uploaded
    if (imageFile) {
      response.profile_pic = imageFile.filename;
    }

    res.json(response);

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

// Search users by username or email
router.get('/search_users', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters'
      });
    }

    const [users] = await pool.execute(
      `SELECT username, email, profile_pic 
       FROM users 
       WHERE username LIKE ? OR email LIKE ? 
       LIMIT 10`,
      [`%${q}%`, `%${q}%`]
    );

    res.json(users);

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search users'
    });
  }
});

module.exports = router;
