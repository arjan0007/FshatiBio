const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/banners
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const result = await pool.query(
      `SELECT id, title, image_url, link_url, display_order
       FROM banners
       WHERE is_active = true
         AND valid_from <= $1
         AND (valid_until IS NULL OR valid_until >= $1)
       ORDER BY display_order ASC, created_at DESC`,
      [now]
    );

    res.json({
      success: true,
      data: { banners: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

