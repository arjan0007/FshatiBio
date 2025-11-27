const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { notifyOrderStatusChange } = require('../services/notificationService');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    // Get statistics
    const [
      totalOrders,
      pendingOrders,
      todaySales,
      weeklySales,
      monthlySales
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM orders'),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
      pool.query(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE
      `),
      pool.query(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `),
      pool.query(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM orders
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `)
    ]);

    res.json({
      success: true,
      data: {
        total_orders: parseInt(totalOrders.rows[0].count),
        pending_orders: parseInt(pendingOrders.rows[0].count),
        today_sales: parseFloat(todaySales.rows[0].total),
        weekly_sales: parseFloat(weeklySales.rows[0].total),
        monthly_sales: parseFloat(monthlySales.rows[0].total)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/orders/unread-count
router.get('/orders/unread-count', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM orders
       WHERE admin_viewed_at IS NULL`
    );

    res.json({
      success: true,
      data: {
        unread_count: parseInt(result.rows[0].unread_count)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.payment_method,
        o.payment_status,
        o.total,
        o.delivery_date,
        u.first_name || ' ' || u.last_name as customer_name,
        u.email as customer_email,
        o.created_at,
        o.admin_viewed_at,
        CASE WHEN o.admin_viewed_at IS NULL THEN true ELSE false END as is_unread
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` WHERE o.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Mark orders as viewed when admin fetches them
    const orderIds = result.rows.map(row => row.id);
    if (orderIds.length > 0) {
      await pool.query(
        `UPDATE orders 
         SET admin_viewed_at = NOW() 
         WHERE id = ANY($1::uuid[]) AND admin_viewed_at IS NULL`,
        [orderIds]
      );
    }

    res.json({
      success: true,
      data: { orders: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'on_delivery', 'delivered', 'cancelled']),
  body('courier_id').optional().isUUID()
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
    const { status, courier_id } = req.body;

    const result = await pool.query(
      `UPDATE orders 
       SET status = $1, courier_id = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, order_number, status`,
      [status, courier_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Record status change in history
    const statusLabels = {
      confirmed: 'Porosia u konfirmua',
      preparing: 'Porosia po përgatitet',
      on_delivery: 'Porosia është në rrugë',
      delivered: 'Porosia u dorëzua',
      cancelled: 'Porosia u anulua'
    };
    
    await pool.query(
      `INSERT INTO order_status_history (order_id, status, changed_by, notes)
       VALUES ($1, $2, $3, $4)`,
      [id, status, req.user.userId, statusLabels[status] || `Statusi u ndryshua në: ${status}`]
    );

    // Send notification to user about status change
    await notifyOrderStatusChange(id, status);
    
    // Send email notification about status change
    const { sendOrderStatusUpdateEmail } = require('../services/emailService');
    sendOrderStatusUpdateEmail(id, status).catch(err => {
      console.error('Error sending order status update email:', err);
    });

    res.json({
      success: true,
      data: { order: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/products
router.get('/products', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      data: { products: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/products
router.post('/products', [
  body('name').trim().notEmpty(),
  body('description').optional().trim(),
  body('category_id').isUUID(),
  body('price').isFloat({ min: 0 }),
  body('unit').isIn(['kg', 'liter', 'piece']),
  body('stock_quantity').isInt({ min: 0 }),
  body('min_order_quantity').optional().isInt({ min: 1 })
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

    const {
      name,
      description,
      category_id,
      price,
      unit,
      stock_quantity,
      min_order_quantity = 1,
      image_urls = [],
      origin,
      freshness_period,
      is_bio = true
    } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const result = await pool.query(
      `INSERT INTO products (
        name, slug, description, category_id, price, unit,
        stock_quantity, min_order_quantity, image_urls, origin,
        freshness_period, is_bio, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      RETURNING *`,
      [
        name, slug, description || null, category_id, price, unit,
        stock_quantity, min_order_quantity, image_urls, origin || null,
        freshness_period || null, is_bio
      ]
    );

    res.status(201).json({
      success: true,
      data: { product: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', [
  body('name').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('is_active').optional().isBoolean()
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
    const updates = [];
    const values = [];
    let paramCount = 0;

    Object.keys(req.body).forEach(key => {
      if (['name', 'description', 'category_id', 'price', 'unit', 'stock_quantity', 
           'min_order_quantity', 'image_urls', 'origin', 'freshness_period', 'is_bio', 'is_active'].includes(key)) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update'
        }
      });
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }

    res.json({
      success: true,
      data: { product: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/suppliers
router.get('/suppliers', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: { suppliers: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/suppliers
router.post('/suppliers', [
  body('name').trim().notEmpty(),
  body('contact_person').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail(),
  body('address').optional().trim(),
  body('region').optional().trim()
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

    const {
      name,
      contact_person,
      phone,
      email,
      address,
      region,
      notes,
      is_active = true
    } = req.body;

    const result = await pool.query(
      `INSERT INTO suppliers (
        name, contact_person, phone, email, address, region, notes, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        name,
        contact_person || null,
        phone || null,
        email || null,
        address || null,
        region || null,
        notes || null,
        is_active
      ]
    );

    res.status(201).json({
      success: true,
      data: { supplier: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/suppliers/:id
router.put('/suppliers/:id', [
  body('name').optional().trim().notEmpty(),
  body('is_active').optional().isBoolean()
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
    const updates = [];
    const values = [];
    let paramCount = 0;

    Object.keys(req.body).forEach(key => {
      if (['name', 'contact_person', 'phone', 'email', 'address', 'region', 'notes', 'is_active'].includes(key)) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update'
        }
      });
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE suppliers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: 'Supplier not found'
        }
      });
    }

    res.json({
      success: true,
      data: { supplier: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/coupons
router.get('/coupons', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: { coupons: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/coupons
router.post('/coupons', [
  body('code').trim().notEmpty(),
  body('type').isIn(['percentage', 'fixed']),
  body('value').isFloat({ min: 0 }),
  body('valid_from').optional().isISO8601(),
  body('valid_until').optional().isISO8601()
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

    const {
      code,
      type,
      value,
      min_order_amount,
      max_discount,
      usage_limit,
      valid_from,
      valid_until,
      is_active = true
    } = req.body;

    const result = await pool.query(
      `INSERT INTO coupons (
        code, type, value, min_order_amount, max_discount,
        usage_limit, valid_from, valid_until, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        code.toUpperCase(),
        type,
        value,
        min_order_amount || null,
        max_discount || null,
        usage_limit || null,
        valid_from || new Date(),
        valid_until || null,
        is_active
      ]
    );

    res.status(201).json({
      success: true,
      data: { coupon: result.rows[0] }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUPON_EXISTS',
          message: 'Kupon me këtë kod ekziston tashmë'
        }
      });
    }
    next(error);
  }
});

// PUT /api/admin/coupons/:id
router.put('/coupons/:id', [
  body('is_active').optional().isBoolean()
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    let paramCount = 0;

    Object.keys(req.body).forEach(key => {
      if (['code', 'type', 'value', 'min_order_amount', 'max_discount', 'usage_limit', 'valid_from', 'valid_until', 'is_active'].includes(key)) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update'
        }
      });
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE coupons SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Coupon not found'
        }
      });
    }

    res.json({
      success: true,
      data: { coupon: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reviews
router.get('/reviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, product_id, is_approved, rating } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.is_verified_purchase,
        r.is_approved,
        r.helpful_count,
        r.created_at,
        r.updated_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        p.name as product_name,
        p.id as product_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (product_id) {
      paramCount++;
      query += ` AND r.product_id = $${paramCount}`;
      params.push(product_id);
    }

    if (is_approved !== undefined) {
      paramCount++;
      query += ` AND r.is_approved = $${paramCount}`;
      params.push(is_approved === 'true');
    }

    if (rating) {
      paramCount++;
      query += ` AND r.rating = $${paramCount}`;
      params.push(rating);
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE 1=1
    `;
    const countParams = [];
    paramCount = 0;

    if (product_id) {
      paramCount++;
      countQuery += ` AND r.product_id = $${paramCount}`;
      countParams.push(product_id);
    }

    if (is_approved !== undefined) {
      paramCount++;
      countQuery += ` AND r.is_approved = $${paramCount}`;
      countParams.push(is_approved === 'true');
    }

    if (rating) {
      paramCount++;
      countQuery += ` AND r.rating = $${paramCount}`;
      countParams.push(rating);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        reviews: result.rows,
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

// PUT /api/admin/reviews/:id/approve
router.put('/reviews/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE reviews 
       SET is_approved = true, updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_approved`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        }
      });
    }

    res.json({
      success: true,
      data: { review: result.rows[0] },
      message: 'Review approved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/reviews/:id/reject
router.put('/reviews/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE reviews 
       SET is_approved = false, updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_approved`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        }
      });
    }

    res.json({
      success: true,
      data: { review: result.rows[0] },
      message: 'Review rejected successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
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

// ========== CATEGORIES MANAGEMENT ==========

// GET /api/admin/categories
router.get('/categories', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, description, image_url, display_order, is_active
       FROM categories
       ORDER BY display_order ASC, name ASC`
    );

    res.json({
      success: true,
      data: { categories: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/categories
router.post('/categories', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('slug').trim().notEmpty().withMessage('Slug is required'),
  body('display_order').optional().isInt({ min: 0 })
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

    const { name, slug, description, image_url, display_order } = req.body;

    // Check if slug already exists
    const existing = await pool.query(
      'SELECT id FROM categories WHERE slug = $1',
      [slug]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SLUG_EXISTS',
          message: 'Category with this slug already exists'
        }
      });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, image_url, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, slug, description || null, image_url || null, display_order || 0]
    );

    res.status(201).json({
      success: true,
      data: { category: result.rows[0] },
      message: 'Category created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', [
  body('name').optional().trim().notEmpty(),
  body('slug').optional().trim().notEmpty(),
  body('display_order').optional().isInt({ min: 0 })
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
    const { name, slug, description, image_url, display_order, is_active } = req.body;

    // Check if category exists
    const existing = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    // Check if slug is being changed and if it conflicts
    if (slug) {
      const slugCheck = await pool.query(
        'SELECT id FROM categories WHERE slug = $1 AND id != $2',
        [slug, id]
      );

      if (slugCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'SLUG_EXISTS',
            message: 'Category with this slug already exists'
          }
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
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

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE categories
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: { category: result.rows[0] },
      message: 'Category updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: 'Cannot delete category with existing products'
        }
      });
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ========== BANNERS MANAGEMENT ==========

// GET /api/admin/banners
router.get('/banners', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, image_url, link_url, display_order, is_active, valid_from, valid_until
       FROM banners
       ORDER BY display_order ASC, created_at DESC`
    );

    res.json({
      success: true,
      data: { banners: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/banners
router.post('/banners', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('image_url').trim().notEmpty().withMessage('Image URL is required')
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

    const { title, image_url, link_url, display_order, valid_from, valid_until, is_active } = req.body;

    const result = await pool.query(
      `INSERT INTO banners (title, image_url, link_url, display_order, valid_from, valid_until, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        image_url,
        link_url || null,
        display_order || 0,
        valid_from || null,
        valid_until || null,
        is_active !== undefined ? is_active : true
      ]
    );

    res.status(201).json({
      success: true,
      data: { banner: result.rows[0] },
      message: 'Banner created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/banners/:id
router.put('/banners/:id', [
  body('title').optional().trim().notEmpty(),
  body('image_url').optional().trim().notEmpty()
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
    const { title, image_url, link_url, display_order, valid_from, valid_until, is_active } = req.body;

    const existing = await pool.query(
      'SELECT id FROM banners WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BANNER_NOT_FOUND',
          message: 'Banner not found'
        }
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (link_url !== undefined) {
      updates.push(`link_url = $${paramCount++}`);
      values.push(link_url);
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(display_order);
    }
    if (valid_from !== undefined) {
      updates.push(`valid_from = $${paramCount++}`);
      values.push(valid_from);
    }
    if (valid_until !== undefined) {
      updates.push(`valid_until = $${paramCount++}`);
      values.push(valid_until);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
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

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE banners
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: { banner: result.rows[0] },
      message: 'Banner updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/banners/:id
router.delete('/banners/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM banners WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BANNER_NOT_FOUND',
          message: 'Banner not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ========== USERS MANAGEMENT ==========

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, first_name, last_name, phone, role, is_active, created_at,
             (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
      FROM users
      WHERE role != 'admin'
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE role != 'admin'`
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, role, is_active, created_at
       FROM users
       WHERE id = $1 AND role != 'admin'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get user orders
    const ordersResult = await pool.query(
      `SELECT id, status, total, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        user: result.rows[0],
        recent_orders: ordersResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', [
  body('is_active').optional().isBoolean()
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
    const { is_active, first_name, last_name, phone } = req.body;

    const existing = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role != \'admin\'',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
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

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, phone, role, is_active`,
      values
    );

    res.json({
      success: true,
      data: { user: result.rows[0] },
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

