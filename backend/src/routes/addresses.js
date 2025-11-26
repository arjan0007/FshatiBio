const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/addresses
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.userId]
    );

    res.json({
      success: true,
      data: { addresses: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/addresses
router.post('/', authenticateToken, [
  body('street').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('postal_code').optional().trim(),
  body('country').optional().trim(),
  body('is_default').optional().isBoolean(),
  body('delivery_notes').optional().trim()
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

    const { street, city, postal_code, country = 'Albania', is_default = false, delivery_notes } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If this is set as default, unset other defaults
      if (is_default) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE user_id = $1',
          [req.user.userId]
        );
      }

      const result = await client.query(
        `INSERT INTO addresses (user_id, street, city, postal_code, country, is_default, delivery_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user.userId, street, city, postal_code || null, country, is_default, delivery_notes || null]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: { address: result.rows[0] }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

// PUT /api/addresses/:id
router.put('/:id', authenticateToken, [
  body('street').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('postal_code').optional().trim(),
  body('country').optional().trim(),
  body('is_default').optional().isBoolean(),
  body('delivery_notes').optional().trim()
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

    // Verify address belongs to user
    const addressResult = await pool.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (addressResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found'
        }
      });
    }

    const { street, city, postal_code, country, is_default, delivery_notes } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If setting as default, unset other defaults
      if (is_default) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2',
          [req.user.userId, id]
        );
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (street !== undefined) {
        paramCount++;
        updates.push(`street = $${paramCount}`);
        values.push(street);
      }
      if (city !== undefined) {
        paramCount++;
        updates.push(`city = $${paramCount}`);
        values.push(city);
      }
      if (postal_code !== undefined) {
        paramCount++;
        updates.push(`postal_code = $${paramCount}`);
        values.push(postal_code);
      }
      if (country !== undefined) {
        paramCount++;
        updates.push(`country = $${paramCount}`);
        values.push(country);
      }
      if (is_default !== undefined) {
        paramCount++;
        updates.push(`is_default = $${paramCount}`);
        values.push(is_default);
      }
      if (delivery_notes !== undefined) {
        paramCount++;
        updates.push(`delivery_notes = $${paramCount}`);
        values.push(delivery_notes);
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

      paramCount++;
      updates.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(
        `UPDATE addresses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: { address: result.rows[0] }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Address not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

