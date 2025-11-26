const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/reviews/product/:productId
// Get reviews for a product
router.get('/product/:productId', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('rating').optional().isInt({ min: 1, max: 5 }),
  query('sort').optional().isIn(['newest', 'oldest', 'highest_rating', 'lowest_rating', 'most_helpful'])
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

    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.is_verified_purchase,
        r.helpful_count,
        r.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1 AND r.is_approved = true
    `;
    const params = [productId];
    let paramCount = 1;

    if (rating) {
      query += ` AND r.rating = $${paramCount + 1}`;
      params.push(rating);
      paramCount++;
    }

    // Sorting
    switch (sort) {
      case 'oldest':
        query += ' ORDER BY r.created_at ASC';
        break;
      case 'highest_rating':
        query += ' ORDER BY r.rating DESC, r.created_at DESC';
        break;
      case 'lowest_rating':
        query += ' ORDER BY r.rating ASC, r.created_at DESC';
        break;
      case 'most_helpful':
        query += ' ORDER BY r.helpful_count DESC, r.created_at DESC';
        break;
      default: // newest
        query += ' ORDER BY r.created_at DESC';
    }

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count and average rating
    let countQuery = `
      SELECT 
        COUNT(*) as total,
        AVG(rating)::numeric(10,2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1
      FROM reviews
      WHERE product_id = $1 AND is_approved = true
    `;
    const countParams = [productId];
    if (rating) {
      countQuery += ' AND rating = $2';
      countParams.push(rating);
    }
    const countResult = await pool.query(countQuery, countParams);
    const stats = countResult.rows[0];

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        stats: {
          total: parseInt(stats.total),
          average_rating: parseFloat(stats.average_rating || 0),
          rating_distribution: {
            5: parseInt(stats.rating_5 || 0),
            4: parseInt(stats.rating_4 || 0),
            3: parseInt(stats.rating_3 || 0),
            2: parseInt(stats.rating_2 || 0),
            1: parseInt(stats.rating_1 || 0),
          }
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(stats.total),
          totalPages: Math.ceil(parseInt(stats.total) / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews
// Create a new review
router.post('/', [
  authenticateToken,
  body('product_id').isUUID().withMessage('Valid product ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
  body('title').optional().isLength({ max: 255 }).withMessage('Title must be max 255 characters'),
  body('order_id').optional().isUUID()
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
    const { product_id, rating, comment, title, order_id } = req.body;

    // Check if user already reviewed this product
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [product_id, userId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REVIEW_EXISTS',
          message: 'You have already reviewed this product'
        }
      });
    }

    // Check if user actually purchased the product (if order_id is provided)
    let isVerifiedPurchase = false;
    if (order_id) {
      const orderCheck = await pool.query(
        `SELECT o.id 
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.id = $1 AND o.user_id = $2 AND oi.product_id = $3 AND o.status = 'delivered'`,
        [order_id, userId, product_id]
      );
      isVerifiedPurchase = orderCheck.rows.length > 0;
    }

    const result = await pool.query(
      `INSERT INTO reviews (product_id, user_id, order_id, rating, title, comment, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, rating, title, comment, is_verified_purchase, created_at`,
      [product_id, userId, order_id || null, rating, title || null, comment || null, isVerifiedPurchase]
    );

    res.status(201).json({
      success: true,
      data: { review: result.rows[0] },
      message: 'Review created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reviews/:id
// Update own review
router.put('/:id', [
  authenticateToken,
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().isLength({ min: 10, max: 1000 }),
  body('title').optional().isLength({ max: 255 })
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

    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment, title } = req.body;

    // Check if review belongs to user
    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found or you do not have permission to update it'
        }
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (rating !== undefined) {
      updates.push(`rating = $${paramCount++}`);
      params.push(rating);
    }
    if (comment !== undefined) {
      updates.push(`comment = $${paramCount++}`);
      params.push(comment);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      params.push(title);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No fields to update'
        }
      });
    }

    params.push(id);
    const query = `
      UPDATE reviews 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, rating, title, comment, is_verified_purchase, updated_at
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: { review: result.rows[0] },
      message: 'Review updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reviews/:id
// Delete own review
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found or you do not have permission to delete it'
        }
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews/:id/helpful
// Mark review as helpful
router.post('/:id/helpful', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already marked as helpful
    const existing = await pool.query(
      'SELECT id FROM review_helpful WHERE review_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_HELPFUL',
          message: 'You have already marked this review as helpful'
        }
      });
    }

    // Add helpful mark
    await pool.query(
      'INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2)',
      [id, userId]
    );

    // Update helpful count
    await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Review marked as helpful'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reviews/:id/helpful
// Unmark review as helpful
router.delete('/:id/helpful', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Helpful mark not found'
        }
      });
    }

    // Update helpful count
    await pool.query(
      'UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Helpful mark removed'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

