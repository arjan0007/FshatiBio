const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/coupons/validate/:code
router.get('/validate/:code', authenticateToken, async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT * FROM coupons 
       WHERE code = $1 
         AND is_active = true
         AND valid_from <= NOW()
         AND (valid_until IS NULL OR valid_until >= NOW())`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Kupon i pavlefshëm ose i skaduar'
        }
      });
    }

    const coupon = result.rows[0];

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUPON_LIMIT_REACHED',
          message: 'Kupon ka arritur kufirin e përdorimit'
        }
      });
    }

    // Check if user already used this coupon
    const userCoupon = await pool.query(
      'SELECT id FROM user_coupons WHERE user_id = $1 AND coupon_id = $2',
      [req.user.userId, coupon.id]
    );

    if (userCoupon.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUPON_ALREADY_USED',
          message: 'Këtë kupon e keni përdorur tashmë'
        }
      });
    }

    res.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: parseFloat(coupon.value),
          min_order_amount: coupon.min_order_amount ? parseFloat(coupon.min_order_amount) : null,
          max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : null
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/coupons/apply
router.post('/apply', authenticateToken, [
  body('code').trim().notEmpty(),
  body('subtotal').isFloat({ min: 0 })
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

    const { code, subtotal } = req.body;

    const couponResult = await pool.query(
      `SELECT * FROM coupons 
       WHERE code = $1 
         AND is_active = true
         AND valid_from <= NOW()
         AND (valid_until IS NULL OR valid_until >= NOW())`,
      [code.toUpperCase()]
    );

    if (couponResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Kupon i pavlefshëm'
        }
      });
    }

    const coupon = couponResult.rows[0];

    // Check min order amount
    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MIN_ORDER_NOT_MET',
          message: `Porosia duhet të jetë së paku ${coupon.min_order_amount} L`
        }
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else {
      discount = coupon.value;
    }

    res.json({
      success: true,
      data: {
        discount: parseFloat(discount.toFixed(2)),
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: parseFloat(coupon.value)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

