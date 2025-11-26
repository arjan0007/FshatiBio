const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// Category colors and icons
const categoryStyles = {
  'qumesht': { bg: '#e8f5e9', text: '#2e7d32', icon: '🥛', name: 'Qumësht' },
  'djathe': { bg: '#fff9e6', text: '#8b6914', icon: '🧀', name: 'Djathë' },
  'veze': { bg: '#fff8e1', text: '#ff9800', icon: '🥚', name: 'Vezë' },
  'zogj-fshati': { bg: '#ffebee', text: '#f44336', icon: '🐔', name: 'Zogj' },
  'mish-vici': { bg: '#ffebee', text: '#d32f2f', icon: '🥩', name: 'Mish Viçi' },
  'mish-qengji': { bg: '#ffebee', text: '#c62828', icon: '🍖', name: 'Mish Qengji' },
  'gjaltpe-kos': { bg: '#fff9c4', text: '#ffc107', icon: '🧈', name: 'Gjalpë & Kos' }
};

async function createProductImage(productName, categorySlug, outputPath) {
  const style = categoryStyles[categorySlug] || { bg: '#e0e0e0', text: '#666666', icon: '📦', name: 'Produkt' };
  
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, width, height);
  
  // Add gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, style.bg);
  gradient.addColorStop(1, style.bg + 'dd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Icon (emoji as text)
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = style.text;
  ctx.fillText(style.icon, width / 2, height / 2 - 60);
  
  // Product name
  ctx.font = 'bold 36px Arial';
  ctx.fillText(productName, width / 2, height / 2 + 80);
  
  // Category badge
  ctx.font = '24px Arial';
  ctx.fillStyle = style.text + '80';
  ctx.fillText(style.name, width / 2, height / 2 + 130);
  
  // BIO badge if applicable
  ctx.fillStyle = '#2e7d32';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('✓ BIO', width / 2, height / 2 + 170);
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

async function generateProductImages() {
  try {
    console.log('🎨 Creating product images...');
    
    const products = await pool.query(`
      SELECT p.id, p.name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    for (const product of products.rows) {
      try {
        const filename = `product-${product.id}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        await createProductImage(
          product.name,
          product.category_slug || 'qumesht',
          filepath
        );
        
        // Update product with local image URL
        const localUrl = `http://localhost:3000/uploads/${filename}`;
        await pool.query(
          'UPDATE products SET image_urls = $1 WHERE id = $2',
          [[localUrl], product.id]
        );
        
        console.log(`✅ ${product.name} - image created`);
      } catch (error) {
        console.log(`⚠️  ${product.name} - ${error.message}`);
      }
    }
    
    console.log('✅ All product images created!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateProductImages();

