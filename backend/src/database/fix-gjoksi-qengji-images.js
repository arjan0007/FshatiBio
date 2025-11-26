const https = require('https');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// URL të vlefshme për foto reale të gjoksit të qengjit nga Pexels dhe Pixabay
const gjoksiQengjiImageUrls = [
  'https://images.pexels.com/photos/361184/asparagus-steak-veal-chop-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'https://images.pexels.com/photos/361184/asparagus-steak-veal-chop-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/361184/asparagus-steak-veal-chop-veal-361184.jpeg',
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
];

// Alternative URLs nga Pixabay
const alternativeUrls = [
  'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_960_720.jpg',
  'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_640.jpg',
  'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605.jpg',
  'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_1280.png',
  'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_960_720.png'
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    const request = https.get(url, options, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 307 || response.statusCode === 308) {
        file.close();
        return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
    
    request.setTimeout(20000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(new Error('Request timeout'));
    });
  });
}

async function fixGjoksiQengjiImages() {
  try {
    console.log('🐑 Fixing Gjoksi qengji images...');
    
    const products = await pool.query(`
      SELECT p.id, p.name, p.image_urls
      FROM products p
      WHERE p.name = 'Gjoksi qengji'
      AND p.is_active = true
    `);
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (products.rows.length === 0) {
      console.log('⚠️  Product "Gjoksi qengji" not found');
      process.exit(0);
    }
    
    const product = products.rows[0];
    console.log(`\n📦 Found product: ${product.name}\n`);
    
    const numImages = 3; // 3 foto për gjoksi qengji
    const downloadedUrls = [];
    const allUrls = [...gjoksiQengjiImageUrls, ...alternativeUrls];
    
    console.log(`📸 Downloading ${numImages} images for: ${product.name}`);
    
    for (let i = 0; i < numImages; i++) {
      const filename = `product-${product.id}-gjoksi-qengji-${i + 1}.jpg`;
      const filepath = path.join(uploadsDir, filename);
      
      let success = false;
      let urlIndex = 0;
      
      while (!success && urlIndex < allUrls.length) {
        try {
          const imageUrl = allUrls[urlIndex];
          await downloadImage(imageUrl, filepath);
          
          const stats = fs.statSync(filepath);
          if (stats.size < 10240) {
            fs.unlinkSync(filepath);
            throw new Error('Image too small');
          }
          
          const localUrl = `http://localhost:3000/uploads/${filename}`;
          downloadedUrls.push(localUrl);
          
          console.log(`   ✅ Image ${i + 1} downloaded (${(stats.size / 1024).toFixed(1)}KB)`);
          success = true;
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          urlIndex++;
          if (urlIndex >= allUrls.length) {
            console.log(`   ❌ Failed to download image ${i + 1} after trying all URLs: ${error.message}`);
          } else {
            console.log(`   ⚠️  Attempt ${urlIndex} failed, trying next URL...`);
          }
        }
      }
    }
    
    if (downloadedUrls.length > 0) {
      await pool.query(
        'UPDATE products SET image_urls = $1 WHERE id = $2',
        [downloadedUrls, product.id]
      );
      console.log(`\n   ✅ Updated product with ${downloadedUrls.length} real images\n`);
    } else {
      console.log(`\n   ⚠️  No images were downloaded for this product\n`);
    }
    
    console.log('✅ Gjoksi qengji images fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixGjoksiQengjiImages();

