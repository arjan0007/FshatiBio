const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, description, image_url, display_order
       FROM categories
       WHERE is_active = true
       ORDER BY display_order ASC, name ASC`
    );

    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image_url: row.image_url,
      display_order: row.display_order
    }));

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND is_active = true',
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
      data: { category: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

