const https = require('https');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// URL të vlefshme për foto reale të qumështit nga Unsplash
const milkImageUrls = {
  'Qumësht i freskët BIO': [
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Qumësht i pasteurizuar BIO': [
    'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Qumësht me yndyrë të lartë': [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ]
};

// Alternative URLs nëse të parat nuk funksionojnë
const alternativeMilkUrls = [
  'https://images.unsplash.com/photo-1550583724-b2692b85b150',
  'https://images.unsplash.com/photo-1563636619-e9143da7973b',
  'https://images.unsplash.com/photo-1563805042-7684c019e1cb',
  'https://images.unsplash.com/photo-1571934811356-5cc061b6821f'
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

async function fixMilkProductImages() {
  try {
    console.log('🥛 Fixing milk product images...');
    
    const products = await pool.query(`
      SELECT p.id, p.name, p.image_urls
      FROM products p
      WHERE p.name LIKE '%Qumësht%'
      AND p.is_active = true
      ORDER BY p.name
    `);
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    console.log(`\n📦 Found ${products.rows.length} milk products\n`);
    
    for (const product of products.rows) {
      try {
        const imageUrls = milkImageUrls[product.name] || [];
        
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
              attempts++;
              if (attempts < maxAttempts) {
                const altUrl = alternativeMilkUrls[attempts % alternativeMilkUrls.length] + '?w=800&h=600&fit=crop';
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
    
    console.log('✅ Milk product images fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMilkProductImages();

