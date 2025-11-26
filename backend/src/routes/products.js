const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const { pool } = require('../config/database');

// GET /api/products
router.get('/', [
  query('category').optional().isUUID(),
  query('search').optional().trim(),
  query('min_price').optional().isFloat({ min: 0 }),
  query('max_price').optional().isFloat({ min: 0 }),
  query('is_bio').optional().isBoolean(),
  query('in_stock').optional().isBoolean(),
  query('min_rating').optional().isFloat({ min: 0, max: 5 }),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest', 'rating_desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: errors.array()
        }
      });
    }

    const { 
      category, 
      search, 
      min_price, 
      max_price, 
      is_bio, 
      in_stock, 
      min_rating,
      sort = 'newest',
      page = 1, 
      limit = 20 
    } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.unit,
        p.stock_quantity,
        p.min_order_quantity,
        p.image_urls,
        p.origin,
        p.freshness_period,
        p.is_bio,
        p.created_at,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = true
      WHERE p.is_active = true
    `;
    const queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      queryText += ` AND p.category_id = $${paramCount}`;
      queryParams.push(category);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (min_price !== undefined) {
      paramCount++;
      queryText += ` AND p.price >= $${paramCount}`;
      queryParams.push(parseFloat(min_price));
    }

    if (max_price !== undefined) {
      paramCount++;
      queryText += ` AND p.price <= $${paramCount}`;
      queryParams.push(parseFloat(max_price));
    }

    if (is_bio !== undefined) {
      paramCount++;
      queryText += ` AND p.is_bio = $${paramCount}`;
      queryParams.push(is_bio === 'true');
    }

    if (in_stock !== undefined) {
      if (in_stock === 'true') {
        queryText += ` AND p.stock_quantity > 0`;
      } else {
        queryText += ` AND p.stock_quantity = 0`;
      }
    }

    queryText += ` GROUP BY p.id, c.id, c.name, c.slug`;

    // Filter by minimum rating (after grouping)
    if (min_rating !== undefined) {
      paramCount++;
      queryText += ` HAVING COALESCE(AVG(r.rating), 0) >= $${paramCount}`;
      queryParams.push(parseFloat(min_rating));
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        queryText += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        queryText += ` ORDER BY p.price DESC`;
        break;
      case 'name_asc':
        queryText += ` ORDER BY p.name ASC`;
        break;
      case 'name_desc':
        queryText += ` ORDER BY p.name DESC`;
        break;
      case 'oldest':
        queryText += ` ORDER BY p.created_at ASC`;
        break;
      case 'rating_desc':
        queryText += ` ORDER BY average_rating DESC, p.created_at DESC`;
        break;
      default: // newest
        queryText += ` ORDER BY p.created_at DESC`;
    }

    queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(queryText, queryParams);

    // Get total count with same filters
    // If min_rating is used, we need to use a subquery with GROUP BY
    let countQuery;
    const countParams = [];
    let countParamCount = 0;

    if (min_rating !== undefined) {
      // Use subquery for rating filter
      countQuery = `
        SELECT COUNT(*) FROM (
          SELECT p.id
          FROM products p
          LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = true
          WHERE p.is_active = true
      `;
    } else {
      countQuery = `
        SELECT COUNT(DISTINCT p.id)
        FROM products p
        WHERE p.is_active = true
      `;
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND p.category_id = $${countParamCount}`;
      countParams.push(category);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (p.name ILIKE $${countParamCount} OR p.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (min_price !== undefined) {
      countParamCount++;
      countQuery += ` AND p.price >= $${countParamCount}`;
      countParams.push(parseFloat(min_price));
    }

    if (max_price !== undefined) {
      countParamCount++;
      countQuery += ` AND p.price <= $${countParamCount}`;
      countParams.push(parseFloat(max_price));
    }

    if (is_bio !== undefined) {
      countParamCount++;
      countQuery += ` AND p.is_bio = $${countParamCount}`;
      countParams.push(is_bio === 'true');
    }

    if (in_stock !== undefined) {
      if (in_stock === 'true') {
        countQuery += ` AND p.stock_quantity > 0`;
      } else {
        countQuery += ` AND p.stock_quantity = 0`;
      }
    }

    if (min_rating !== undefined) {
      countParamCount++;
      countQuery += ` GROUP BY p.id HAVING COALESCE(AVG(r.rating), 0) >= $${countParamCount}`;
      countParams.push(parseFloat(min_rating));
      countQuery += ` ) as filtered_products`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.count || 0);

    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: parseFloat(row.price),
      unit: row.unit,
      stock_quantity: row.stock_quantity,
      min_order_quantity: row.min_order_quantity,
      image_urls: row.image_urls || [],
      origin: row.origin,
      freshness_period: row.freshness_period,
      is_bio: row.is_bio,
      average_rating: parseFloat(row.average_rating || 0),
      review_count: parseInt(row.review_count || 0),
      category: row.category_id ? {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug
      } : null
    }));

    res.json({
      success: true,
      data: {
        products,
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

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.is_active = true`,
      [id]
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

    const row = result.rows[0];
    const product = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: parseFloat(row.price),
      unit: row.unit,
      stock_quantity: row.stock_quantity,
      min_order_quantity: row.min_order_quantity,
      image_urls: row.image_urls || [],
      origin: row.origin,
      freshness_period: row.freshness_period,
      is_bio: row.is_bio,
      category: row.category_id ? {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug
      } : null,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

