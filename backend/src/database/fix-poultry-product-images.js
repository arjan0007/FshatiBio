const https = require('https');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// URL të vlefshme për foto reale të zogjve fshati nga Unsplash
const poultryImageUrls = {
  'Pulë e plotë': [
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop&q=80'
  ],
  'Gjoksi i pulës': [
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop&q=80'
  ],
  'Kofshë pulë': [
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop&q=80'
  ],
  'Gjeli i plotë': [
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop&q=80'
  ]
};

// Alternative URLs nëse të parat nuk funksionojnë
const alternativePoultryUrls = [
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop&q=80'
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
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
    
    request.setTimeout(15000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(new Error('Request timeout'));
    });
  });
}

async function fixPoultryProductImages() {
  try {
    console.log('🐔 Fixing poultry product images...');
    
    const products = await pool.query(`
      SELECT p.id, p.name, p.image_urls
      FROM products p
      WHERE (p.name LIKE '%Pulë%' OR p.name LIKE '%Gjeli%' OR p.name LIKE '%Gjoksi%' OR p.name LIKE '%Kofshë pulë%')
      AND p.is_active = true
      ORDER BY p.name
    `);
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    console.log(`\n📦 Found ${products.rows.length} poultry products\n`);
    
    for (const product of products.rows) {
      try {
        const imageUrls = poultryImageUrls[product.name] || [];
        
        if (imageUrls.length === 0) {
          console.log(`⚠️  No URLs found for: ${product.name}`);
          continue;
        }
        
        const numImages = 2 + Math.floor(Math.random() * 2); // 2-3 foto
        const downloadedUrls = [];
        
        console.log(`📸 Downloading ${numImages} images for: ${product.name}`);
        
        // Përdor alternative URLs direkt nëse URL-të kryesore nuk funksionojnë
        const allUrls = [...imageUrls, ...alternativePoultryUrls];
        
        for (let i = 0; i < numImages; i++) {
          const filename = `product-${product.id}-real-${i + 1}.jpg`;
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
                console.log(`   ❌ Failed to download image ${i + 1} after trying all URLs`);
              }
            }
          }
        }
        
        if (downloadedUrls.length > 0) {
          await pool.query(
            'UPDATE products SET image_urls = $1 WHERE id = $2',
            [downloadedUrls, product.id]
          );
          console.log(`   ✅ Updated product with ${downloadedUrls.length} real images\n`);
        } else {
          console.log(`   ⚠️  No images were downloaded for this product\n`);
        }
      } catch (error) {
        console.log(`   ❌ Error processing product: ${error.message}\n`);
      }
    }
    
    console.log('✅ Poultry product images fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPoultryProductImages();

