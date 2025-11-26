const https = require('https');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// Real food image URLs from reliable sources
const productImageUrls = {
  // Qumësht
  'qumësht i freskët bio': 'https://images.unsplash.com/photo-1550583724-b2693b17b9ab?w=800&h=600&fit=crop',
  'qumësht i pasteurizuar bio': 'https://images.unsplash.com/photo-1571934811-9c1e8b1a1e1e?w=800&h=600&fit=crop',
  'qumësht me yndyrë të lartë': 'https://images.unsplash.com/photo-1550583724-b2693b17b9ab?w=800&h=600&fit=crop',
  // Djathë
  'djathë i bardhë': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
  'djathë i vjetër': 'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop',
  'djathë i butë': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
  // Vezë
  'vezë të freskëta': 'https://images.unsplash.com/photo-1582724658326-05b143bc3c11?w=800&h=600&fit=crop',
  'vezë të mëdha': 'https://images.unsplash.com/photo-1518568814500-bf0f82d0c4ce?w=800&h=600&fit=crop',
  'vezë me ylber portokalli': 'https://images.unsplash.com/photo-1582724658326-05b143bc3c11?w=800&h=600&fit=crop',
  // Zogj
  'pulë e plotë': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  'gjoksi i pulës': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  'kofshë pulë': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  'gjeli i plotë': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  // Mish Viçi
  'mish viçi i freskët': 'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?w=800&h=600&fit=crop',
  'biftek viçi': 'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?w=800&h=600&fit=crop',
  'mish i grirë viçi': 'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?w=800&h=600&fit=crop',
  'kofshë viçi': 'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?w=800&h=600&fit=crop',
  // Mish Qengji
  'mish qengji i freskët': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  'kofshë qengji': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  'gjoksi qengji': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop',
  // Gjalpë & Kos
  'gjalpë i bërë në shtëpi': 'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop',
  'kos i bërë në shtëpi': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
  'kos i trashë': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
  'gjalpë me hudhër': 'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop'
};

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

async function updateProductImages() {
  try {
    console.log('📥 Downloading product images...');
    
    const products = await pool.query('SELECT id, name FROM products');
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    for (const product of products.rows) {
      const productKey = product.name.toLowerCase();
      const imageUrl = productImageUrls[productKey];
      
      if (imageUrl) {
        try {
          const filename = `product-${product.id}.jpg`;
          const filepath = path.join(uploadsDir, filename);
          
          // Download image
          await downloadImage(imageUrl, filepath);
          
          // Update product with local image URL
          const localUrl = `http://localhost:3000/uploads/${filename}`;
          await pool.query(
            'UPDATE products SET image_urls = $1 WHERE id = $2',
            [[localUrl], product.id]
          );
          
          console.log(`✅ ${product.name} - image downloaded`);
        } catch (error) {
          console.log(`⚠️  ${product.name} - ${error.message}`);
        }
      }
    }
    
    console.log('✅ All images processed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateProductImages();

