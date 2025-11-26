const { pool } = require('../config/database');

async function checkProducts() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive
      FROM products
    `);
    
    console.log('📊 Product Statistics:');
    console.log(`   Total products: ${result.rows[0].total}`);
    console.log(`   Active products: ${result.rows[0].active}`);
    console.log(`   Inactive products: ${result.rows[0].inactive}`);
    
    const products = await pool.query(`
      SELECT id, name, is_active, stock_quantity, category_id
      FROM products
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📦 Sample products:');
    products.rows.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - Active: ${p.is_active}, Stock: ${p.stock_quantity}`);
    });
    
    const categories = await pool.query('SELECT COUNT(*) as count FROM categories');
    console.log(`\n📁 Categories: ${categories.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProducts();

