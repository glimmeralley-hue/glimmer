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
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all products
router.get('/get_products', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products ORDER BY id DESC'
    );

    res.json(products);

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// Get single product
router.get('/get_product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.json(products[0]);

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
});

// Add product (admin only - for future use)
router.post('/add_product', upload.single('product_photo'), [
  body('product_name').trim().isLength({ min: 1 }).withMessage('Product name required'),
  body('product_cost').isFloat({ min: 0 }).withMessage('Valid cost required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { product_name, product_description, product_cost } = req.body;
    const product_photo = req.file ? req.file.filename : null;

    const [result] = await pool.execute(
      'INSERT INTO products (product_name, product_description, product_cost, product_photo) VALUES (?, ?, ?, ?)',
      [product_name, product_description, product_cost, product_photo]
    );

    res.status(201).json({
      status: 'success',
      message: 'Product added successfully',
      product_id: result.insertId
    });

  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add product'
    });
  }
});

// Update product (admin only - for future use)
router.put('/update_product/:id', upload.single('product_photo'), [
  body('product_name').trim().isLength({ min: 1 }).withMessage('Product name required'),
  body('product_cost').isFloat({ min: 0 }).withMessage('Valid cost required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg
      });
    }

    const { id } = req.params;
    const { product_name, product_description, product_cost } = req.body;
    const product_photo = req.file ? req.file.filename : null;

    // Check if product exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    let updateQuery = 'UPDATE products SET product_name = ?, product_description = ?, product_cost = ?';
    let updateParams = [product_name, product_description, product_cost];

    if (product_photo) {
      updateQuery += ', product_photo = ?';
      updateParams.push(product_photo);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.execute(updateQuery, updateParams);

    res.json({
      status: 'success',
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product'
    });
  }
});

// Delete product (admin only - for future use)
router.delete('/delete_product/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );

    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;
