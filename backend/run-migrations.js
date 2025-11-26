const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔄 Running migrations...');
    const migrationsDir = path.join(__dirname, 'src/database/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  Migrations directory not found');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      console.log(`📄 Running: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      try {
        await pool.query(sql);
        console.log(`✅ ${file} completed`);
      } catch (error) {
        // Ignore errors for things that already exist
        if (error.code === '42710' || error.code === '42P07' || error.message.includes('already exists')) {
          console.log(`ℹ️  ${file} - already exists, skipping`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigrations();

