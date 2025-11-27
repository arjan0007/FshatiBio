const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/cart
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id,
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.unit,
        p.image_urls,
        p.stock_quantity,
        (c.quantity * p.price) as total_price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1 AND p.is_active = true
      ORDER BY c.created_at DESC`,
      [req.user.userId]
    );

    const items = result.rows.map(row => ({
      id: row.id,
      product: {
        id: row.product_id,
        name: row.name,
        price: parseFloat(row.price),
        unit: row.unit,
        image_urls: row.image_urls || [],
        stock_quantity: row.stock_quantity
      },
      quantity: row.quantity,
      total_price: parseFloat(row.total_price)
    }));

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const deliveryFee = 200; // Fixed delivery fee for now
    const total = subtotal + deliveryFee;

    res.json({
      success: true,
      data: {
        items,
        subtotal: subtotal.toFixed(2),
        delivery_fee: deliveryFee.toFixed(2),
        total: total.toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/add
router.post('/add', authenticateToken, [
  body('product_id').isUUID(),
  body('quantity').isInt({ min: 1 })
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

    const { product_id, quantity } = req.body;

    // Check if product exists and is active
    const productResult = await pool.query(
      'SELECT id, price, stock_quantity FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }

    const product = productResult.rows[0];

    // Check stock
    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${product.stock_quantity} items available in stock`
        }
      });
    }

    // Check if item already in cart
    const existingCart = await pool.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, product_id]
    );

    if (existingCart.rows.length > 0) {
      // Update quantity
      const newQuantity = existingCart.rows[0].quantity + quantity;
      
      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Cannot add more items. Only ${product.stock_quantity} available in stock`
          }
        });
      }

      await pool.query(
        'UPDATE cart SET quantity = $1, updated_at = NOW() WHERE id = $2',
        [newQuantity, existingCart.rows[0].id]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.userId, product_id, quantity]
      );
    }

    res.json({
      success: true,
      message: 'Product added to cart'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/cart/update/:item_id
router.put('/update/:item_id', authenticateToken, [
  body('quantity').isInt({ min: 1 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Quantity must be at least 1'
        }
      });
    }

    const { item_id } = req.params;
    const { quantity } = req.body;

    // Get cart item with product info
    const cartResult = await pool.query(
      `SELECT c.id, c.product_id, p.stock_quantity
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [item_id, req.user.userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_ITEM_NOT_FOUND',
          message: 'Cart item not found'
        }
      });
    }

    const product = cartResult.rows[0];

    if (quantity > product.stock_quantity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${product.stock_quantity} items available in stock`
        }
      });
    }

    await pool.query(
      'UPDATE cart SET quantity = $1, updated_at = NOW() WHERE id = $2',
      [quantity, item_id]
    );

    res.json({
      success: true,
      message: 'Cart updated'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/remove/:item_id
router.delete('/remove/:item_id', authenticateToken, async (req, res, next) => {
  try {
    const { item_id } = req.params;

    const result = await pool.query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
      [item_id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_ITEM_NOT_FOUND',
          message: 'Cart item not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/clear
router.delete('/clear', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM cart WHERE user_id = $1',
      [req.user.userId]
    );

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

