const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    
    const products = await pool.query('SELECT COUNT(*) FROM products WHERE is_active = true');
    console.log('✅ Active products:', products.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();

