const https = require('https');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// URL të vlefshme për foto reale të mishit nga Unsplash
const meatImageUrls = {
  'Mish viçi i freskët': [
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Biftek viçi': [
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Mish i grirë viçi': [
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Kofshë viçi': [
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Mish qengji i freskët': [
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Kofshë qengji': [
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Gjoksi qengji': [
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ]
};

// Alternative URLs nëse të parat nuk funksionojnë
const alternativeMeatUrls = [
  'https://images.unsplash.com/photo-1603048297172-c925447447b6',
  'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e',
  'https://images.unsplash.com/photo-1604503468506-a8da13d82791',
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7'
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
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

async function fixMeatProductImages() {
  try {
    console.log('🔧 Fixing meat product images...');
    
    const products = await pool.query(`
      SELECT p.id, p.name, p.image_urls
      FROM products p
      WHERE (p.name LIKE '%viçi%' OR p.name LIKE '%qengji%')
      AND p.is_active = true
      ORDER BY p.name
    `);
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    console.log(`\n📦 Found ${products.rows.length} meat products\n`);
    
    for (const product of products.rows) {
      try {
        const currentImages = Array.isArray(product.image_urls) ? product.image_urls : [];
        const imageUrls = meatImageUrls[product.name] || [];
        
        if (imageUrls.length === 0) {
          console.log(`⚠️  No URLs found for: ${product.name}`);
          continue;
        }
        
        const numImages = 2 + Math.floor(Math.random() * 2); // 2-3 foto
        const downloadedUrls = [];
        
        console.log(`📸 Downloading ${numImages} images for: ${product.name}`);
        
        for (let i = 0; i < numImages; i++) {
          const imageUrl = imageUrls[i % imageUrls.length];
          const filename = `product-${product.id}-real-${i + 1}.jpg`;
          const filepath = path.join(uploadsDir, filename);
          
          let success = false;
          let attempts = 0;
          const maxAttempts = 3;
          
          while (!success && attempts < maxAttempts) {
            try {
              await downloadImage(imageUrl, filepath);
              
              // Verifikojmë që foto është e vlefshme
              const stats = fs.statSync(filepath);
              if (stats.size < 10240) {
                fs.unlinkSync(filepath);
                throw new Error('Image too small');
              }
              
              const localUrl = `http://localhost:3000/uploads/${filename}`;
              downloadedUrls.push(localUrl);
              
              console.log(`   ✅ Image ${i + 1} downloaded (${(stats.size / 1024).toFixed(1)}KB)`);
              success = true;
              
              // Pause pak
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              attempts++;
              if (attempts < maxAttempts) {
                // Provoj një URL alternative
                const altUrl = alternativeMeatUrls[attempts % alternativeMeatUrls.length] + '?w=800&h=600&fit=crop';
                try {
                  await downloadImage(altUrl, filepath);
                  const stats = fs.statSync(filepath);
                  if (stats.size >= 10240) {
                    const localUrl = `http://localhost:3000/uploads/${filename}`;
                    downloadedUrls.push(localUrl);
                    console.log(`   ✅ Alternative image ${i + 1} downloaded`);
                    success = true;
                  }
                } catch (altError) {
                  console.log(`   ⚠️  Attempt ${attempts} failed: ${error.message}`);
                }
              } else {
                console.log(`   ❌ Failed to download image ${i + 1} after ${maxAttempts} attempts`);
              }
            }
          }
        }
        
        // Update product me foto të reja
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
    
    console.log('✅ Meat product images fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMeatProductImages();

