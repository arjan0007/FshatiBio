const { createCanvas } = require('canvas');
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

// Variacione të ngjyrave për foto të ndryshme
const colorVariations = [
  { offset: 0, intensity: 1.0 },
  { offset: 30, intensity: 0.9 },
  { offset: 60, intensity: 1.1 },
  { offset: 90, intensity: 0.95 },
  { offset: 120, intensity: 1.05 }
];

async function createProductImage(productName, categorySlug, outputPath, variationIndex = 0) {
  const style = categoryStyles[categorySlug] || { bg: '#e0e0e0', text: '#666666', icon: '📦', name: 'Produkt' };
  const variation = colorVariations[variationIndex % colorVariations.length];
  
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background me variacion
  const baseBg = style.bg;
  ctx.fillStyle = baseBg;
  ctx.fillRect(0, 0, width, height);
  
  // Add gradient overlay me variacion
  const gradient = ctx.createLinearGradient(
    variation.offset, 
    variation.offset, 
    width - variation.offset, 
    height - variation.offset
  );
  gradient.addColorStop(0, baseBg);
  gradient.addColorStop(0.5, adjustColorBrightness(baseBg, variation.intensity));
  gradient.addColorStop(1, baseBg + 'dd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Pattern background për variacion
  if (variationIndex % 2 === 0) {
    // Dots pattern
    ctx.fillStyle = style.text + '10';
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 15; j++) {
        ctx.beginPath();
        ctx.arc(i * 40 + variation.offset, j * 40 + variation.offset, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Lines pattern
    ctx.strokeStyle = style.text + '08';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 80 + variation.offset, 0);
      ctx.lineTo(i * 80 + variation.offset, height);
      ctx.stroke();
    }
  }
  
  // Icon (emoji as text) me pozicion të ndryshëm
  const iconX = width / 2 + (variationIndex % 3 - 1) * 20;
  const iconY = height / 2 - 60 + (variationIndex % 2) * 10;
  const iconSize = 120 + (variationIndex % 3) * 10;
  
  ctx.font = `bold ${iconSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = style.text;
  ctx.fillText(style.icon, iconX, iconY);
  
  // Product name me font size të ndryshëm
  const nameSize = 36 - (variationIndex % 2) * 2;
  ctx.font = `bold ${nameSize}px Arial`;
  ctx.fillText(productName, width / 2, height / 2 + 80);
  
  // Category badge
  ctx.font = '24px Arial';
  ctx.fillStyle = style.text + '80';
  ctx.fillText(style.name, width / 2, height / 2 + 130);
  
  // BIO badge me pozicion të ndryshëm
  const bioX = width / 2 + (variationIndex % 2 === 0 ? -10 : 10);
  ctx.fillStyle = '#2e7d32';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('✓ BIO', bioX, height / 2 + 170);
  
  // Add decorative elements për variacion
  if (variationIndex % 3 === 0) {
    // Circle decoration
    ctx.strokeStyle = style.text + '20';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 200, 0, Math.PI * 2);
    ctx.stroke();
  } else if (variationIndex % 3 === 1) {
    // Corner decorations
    ctx.strokeStyle = style.text + '15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(100, 50);
    ctx.lineTo(50, 100);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - 50, height - 50);
    ctx.lineTo(width - 100, height - 50);
    ctx.lineTo(width - 50, height - 100);
    ctx.stroke();
  }
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

function adjustColorBrightness(hex, factor) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Adjust brightness
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  
  // Convert back to hex
  return '#' + [newR, newG, newB].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

async function addMultipleProductImages() {
  try {
    console.log('🎨 Adding multiple images to all products...');
    
    const products = await pool.query(`
      SELECT p.id, p.name, c.slug as category_slug, p.image_urls
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.name
    `);
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    console.log(`\n📦 Found ${products.rows.length} products\n`);
    
    for (const product of products.rows) {
      try {
        const imageUrls = [];
        const numImages = 2 + Math.floor(Math.random() * 2); // 2-3 foto për produkt
        
        console.log(`📸 Creating ${numImages} images for: ${product.name}`);
        
        for (let i = 0; i < numImages; i++) {
          const filename = `product-${product.id}-${i + 1}.png`;
          const filepath = path.join(uploadsDir, filename);
          
          await createProductImage(
            product.name,
            product.category_slug || 'qumesht',
            filepath,
            i // variation index
          );
          
          // Create local URL
          const localUrl = `http://localhost:3000/uploads/${filename}`;
          imageUrls.push(localUrl);
        }
        
        // Update product with multiple image URLs
        await pool.query(
          'UPDATE products SET image_urls = $1 WHERE id = $2',
          [imageUrls, product.id]
        );
        
        console.log(`   ✅ Added ${imageUrls.length} images\n`);
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}\n`);
      }
    }
    
    console.log('✅ All product images added successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total products processed: ${products.rows.length}`);
    console.log(`   Images created: ${products.rows.length * 2}+`);
    console.log(`   Location: ${uploadsDir}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addMultipleProductImages();

