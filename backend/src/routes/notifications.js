const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification, sendPromotionalNotification } = require('../services/notificationService');

// POST /api/notifications/register-token
// Register FCM token for push notifications
router.post('/register-token', [
  authenticateToken,
  body('fcm_token').notEmpty().withMessage('FCM token is required')
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
    const { fcm_token } = req.body;

    await pool.query(
      'UPDATE users SET fcm_token = $1 WHERE id = $2',
      [fcm_token, userId]
    );

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications
// Get user's notifications
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, type, title, message, is_read, link_url, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (unread_only === 'true') {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    if (unread_only === 'true') {
      countQuery += ' AND is_read = false';
    }
    const countResult = await pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read
// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all
// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count
// Get count of unread notifications
router.get('/unread-count', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      data: {
        unread_count: parseInt(result.rows[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/send-promotional (Admin only)
// Send promotional notification to all users
router.post('/send-promotional', [
  authenticateToken,
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

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

    const { title, message, link_url } = req.body;

    const result = await sendPromotionalNotification(title, message, link_url);

    res.json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Notification sent to ${result.successCount} users`
        : result.error
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

