const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/wishlist
// Get user's wishlist
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        w.id,
        w.created_at,
        p.id as product_id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.unit,
        p.stock_quantity,
        p.image_urls,
        p.is_bio,
        c.name as category_name
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = $1 AND p.is_active = true
      ORDER BY w.created_at DESC`,
      [userId]
    );

    const wishlist = result.rows.map(row => ({
      id: row.id,
      created_at: row.created_at,
      product: {
        id: row.product_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        price: parseFloat(row.price),
        unit: row.unit,
        stock_quantity: row.stock_quantity,
        image_urls: row.image_urls || [],
        is_bio: row.is_bio,
        category_name: row.category_name
      }
    }));

    res.json({
      success: true,
      data: { wishlist }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/wishlist
// Add product to wishlist
router.post('/', [
  authenticateToken,
  body('product_id').isUUID().withMessage('Valid product ID is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const userId = req.user.id;
    const { product_id } = req.body;

    // Check if product exists and is active
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found or inactive'
        }
      });
    }

    // Check if already in wishlist
    const existing = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_IN_WISHLIST',
          message: 'Product is already in wishlist'
        }
      });
    }

    // Add to wishlist
    const result = await pool.query(
      `INSERT INTO wishlist (user_id, product_id)
       VALUES ($1, $2)
       RETURNING id, created_at`,
      [userId, product_id]
    );

    res.status(201).json({
      success: true,
      data: { wishlist_item: result.rows[0] },
      message: 'Product added to wishlist'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/wishlist/:productId
// Remove product from wishlist
router.delete('/:productId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await pool.query(
      'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_IN_WISHLIST',
          message: 'Product is not in wishlist'
        }
      });
    }

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/wishlist/check/:productId
// Check if product is in wishlist
router.get('/check/:productId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    res.json({
      success: true,
      data: {
        in_wishlist: result.rows.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

