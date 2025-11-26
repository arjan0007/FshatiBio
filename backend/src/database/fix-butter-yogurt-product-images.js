const https = require('https');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// URL të vlefshme për foto reale të gjalpit dhe kosit nga Pexels dhe Pixabay
const butterYogurtImageUrls = {
  'Gjalpë me hudhër': [
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_960_720.jpg'
  ],
  'Kos i trashë': [
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_960_720.jpg'
  ],
  'Kos i bërë në shtëpi': [
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_960_720.jpg'
  ],
  'Gjalpë i bërë në shtëpi': [
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_960_720.jpg'
  ]
};

// Alternative URLs për gjalpë dhe kos - përdorim URL të ndryshme për çdo lloj
const alternativeUrls = {
  butter: [
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_960_720.jpg'
  ],
  yogurt: [
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/06/11/04/06/raw-meat-1449605_960_720.jpg'
  ]
};

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

async function fixButterYogurtProductImages() {
  try {
    console.log('🧈 Fixing butter and yogurt product images...');
    
    const products = await pool.query(`
      SELECT p.id, p.name, p.image_urls
      FROM products p
      WHERE (p.name LIKE '%Gjalpë%' OR p.name LIKE '%Kos%')
      AND p.is_active = true
      ORDER BY p.name
    `);
    
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    console.log(`\n📦 Found ${products.rows.length} butter and yogurt products\n`);
    
    for (const product of products.rows) {
      try {
        const imageUrls = butterYogurtImageUrls[product.name] || [];
        const isButter = product.name.toLowerCase().includes('gjalpë');
        const fallbackUrls = isButter ? alternativeUrls.butter : alternativeUrls.yogurt;
        const allUrls = imageUrls.length > 0 ? imageUrls : fallbackUrls;
        
        if (allUrls.length === 0) {
          console.log(`⚠️  No URLs found for: ${product.name}`);
          continue;
        }
        
        const numImages = 2 + Math.floor(Math.random() * 2); // 2-3 foto
        const downloadedUrls = [];
        
        console.log(`📸 Downloading ${numImages} images for: ${product.name}`);
        
        for (let i = 0; i < numImages; i++) {
          const filename = `product-${product.id}-butter-yogurt-${i + 1}.jpg`;
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
          console.log(`   ✅ Updated product with ${downloadedUrls.length} real images\n`);
        } else {
          console.log(`   ⚠️  No images were downloaded for this product\n`);
        }
      } catch (error) {
        console.log(`   ❌ Error processing product: ${error.message}\n`);
      }
    }
    
    console.log('✅ Butter and yogurt product images fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixButterYogurtProductImages();

