const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// POST /api/orders
router.post('/', authenticateToken, [
  body('address_id').isUUID(),
  body('payment_method').isIn(['cod', 'online']),
  body('delivery_date').isISO8601(),
  body('delivery_time_slot').optional().trim(),
  body('notes').optional().trim()
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

    const { address_id, payment_method, delivery_date, delivery_time_slot, notes } = req.body;

    // Verify address belongs to user
    const addressResult = await pool.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2',
      [address_id, req.user.userId]
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

    // Get cart items
    const cartResult = await pool.query(
      `SELECT 
        c.product_id,
        c.quantity,
        p.price,
        p.name,
        p.stock_quantity
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1 AND p.is_active = true`,
      [req.user.userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_CART',
          message: 'Cart is empty'
        }
      });
    }

    // Check stock availability
    for (const item of cartResult.rows) {
      if (item.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock for ${item.name}`
          }
        });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = cartResult.rows.map(item => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      subtotal += itemTotal;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        total_price: itemTotal
      };
    });

    const deliveryFee = 200; // Fixed for now
    
    // Handle coupon if provided
    let discountAmount = 0;
    let couponId = null;
    if (req.body.coupon_id) {
      const couponResult = await pool.query(
        'SELECT * FROM coupons WHERE id = $1 AND is_active = true',
        [req.body.coupon_id]
      );
      
      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];
        // Calculate discount
        if (coupon.type === 'percentage') {
          discountAmount = (subtotal * coupon.value) / 100;
          if (coupon.max_discount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount);
          }
        } else {
          discountAmount = coupon.value;
        }
        couponId = coupon.id;
      }
    }
    
    const total = subtotal - discountAmount + deliveryFee;

    // Generate order number
    const orderNumber = `FSB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    // Generate tracking number (unique 12-character alphanumeric)
    const generateTrackingNumber = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const trackingNumber = generateTrackingNumber();
    
    // Calculate estimated delivery time (delivery_date + 1 day for preparation)
    const estimatedDeliveryTime = new Date(delivery_date);
    estimatedDeliveryTime.setDate(estimatedDeliveryTime.getDate() + 1);
    estimatedDeliveryTime.setHours(14, 0, 0, 0); // Default 2 PM delivery time

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          order_number, tracking_number, user_id, address_id, status, payment_method,
          payment_status, subtotal, delivery_fee, discount_amount, total, delivery_date,
          delivery_time_slot, estimated_delivery_time, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, order_number, tracking_number, status, total, created_at`,
        [
          orderNumber,
          trackingNumber,
          req.user.userId,
          address_id,
          'pending',
          payment_method,
          payment_method === 'cod' ? 'pending' : 'pending',
          subtotal,
          deliveryFee,
          discountAmount,
          total,
          delivery_date,
          delivery_time_slot || null,
          estimatedDeliveryTime,
          notes || null
        ]
      );

      const order = orderResult.rows[0];
      
      // Record initial status in history
      await client.query(
        `INSERT INTO order_status_history (order_id, status, changed_by, notes)
         VALUES ($1, $2, $3, $4)`,
        [order.id, 'pending', req.user.userId, 'Porosia u krijua']
      );

      // Create order items and update stock
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.quantity, item.unit_price, item.total_price]
        );

        // Update product stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Clear cart
      await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.userId]);

      // Record coupon usage if applicable
      if (couponId) {
        await client.query(
          'INSERT INTO user_coupons (user_id, coupon_id, order_id) VALUES ($1, $2, $3)',
          [req.user.userId, couponId, order.id]
        );
        
        // Update coupon used count
        await client.query(
          'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
          [couponId]
        );
      }

      await client.query('COMMIT');

      // Send order confirmation email
      const { sendOrderConfirmationEmail } = require('../services/emailService');
      sendOrderConfirmationEmail(order.id).catch(err => {
        console.error('Error sending order confirmation email:', err);
      });

      res.status(201).json({
        success: true,
        data: {
          order: {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            total: parseFloat(order.total),
            delivery_date,
            created_at: order.created_at
          }
        }
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

// GET /api/orders
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.tracking_number,
        o.status,
        o.payment_method,
        o.payment_status,
        o.total,
        o.delivery_date,
        o.estimated_delivery_time,
        o.created_at
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC`,
      [req.user.userId]
    );

    const orders = result.rows.map(row => ({
      id: row.id,
      order_number: row.order_number,
      tracking_number: row.tracking_number,
      status: row.status,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      total: parseFloat(row.total),
      delivery_date: row.delivery_date,
      estimated_delivery_time: row.estimated_delivery_time,
      created_at: row.created_at
    }));

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT 
        o.*,
        a.street,
        a.city,
        a.postal_code,
        a.delivery_notes
      FROM orders o
      JOIN addresses a ON o.address_id = a.id
      WHERE o.id = $1 AND o.user_id = $2`,
      [id, req.user.userId]
    );
    
    // Get status history
    const historyResult = await pool.query(
      `SELECT 
        osh.*,
        u.first_name || ' ' || u.last_name as changed_by_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.changed_by = u.id
      WHERE osh.order_id = $1
      ORDER BY osh.created_at ASC`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT 
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        p.id as product_id,
        p.name,
        p.unit,
        p.image_urls
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          order_number: order.order_number,
          tracking_number: order.tracking_number,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          subtotal: parseFloat(order.subtotal),
          delivery_fee: parseFloat(order.delivery_fee),
          discount_amount: parseFloat(order.discount_amount || 0),
          total: parseFloat(order.total),
          delivery_date: order.delivery_date,
          delivery_time_slot: order.delivery_time_slot,
          estimated_delivery_time: order.estimated_delivery_time,
          notes: order.notes,
          status_history: historyResult.rows.map(h => ({
            status: h.status,
            notes: h.notes,
            changed_by: h.changed_by_name || 'Sistemi',
            created_at: h.created_at
          })),
          address: {
            street: order.street,
            city: order.city,
            postal_code: order.postal_code,
            delivery_notes: order.delivery_notes
          },
          items: itemsResult.rows.map(item => ({
            product: {
              id: item.product_id,
              name: item.name,
              unit: item.unit,
              image_urls: item.image_urls || []
            },
            quantity: item.quantity,
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price)
          })),
          created_at: order.created_at,
          updated_at: order.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      'SELECT id, status FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Only pending orders can be cancelled'
        }
      });
    }

    // Restore stock
    const itemsResult = await pool.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [id]
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Restore stock for each item
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Update order status
      await client.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
        ['cancelled', id]
      );

      await client.query('COMMIT');

      // Send email notification about cancellation
      const { sendOrderStatusUpdateEmail } = require('../services/emailService');
      sendOrderStatusUpdateEmail(id, 'cancelled').catch(err => {
        console.error('Error sending order cancellation email:', err);
      });

      res.json({
        success: true,
        message: 'Order cancelled successfully'
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

module.exports = router;

