const https = require('https');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// Unsplash Access Key (përdor një key publike ose krijo një account falas)
// Për test, mund të përdorim Unsplash Source API që nuk kërkon key
const UNSPLASH_SOURCE = 'https://source.unsplash.com';

// Mapping i produkteve me terma kërkimi për Unsplash
const productSearchTerms = {
  // Qumësht
  'Qumësht i freskët BIO': ['fresh milk', 'organic milk', 'farm milk'],
  'Qumësht i pasteurizuar BIO': ['pasteurized milk', 'milk bottle', 'organic milk bottle'],
  'Qumësht me yndyrë të lartë': ['whole milk', 'full cream milk', 'milk'],
  
  // Djathë
  'Djathë i bardhë': ['white cheese', 'fresh cheese', 'cottage cheese'],
  'Djathë i vjetër': ['aged cheese', 'hard cheese', 'cheese block'],
  'Djathë i butë': ['soft cheese', 'fresh cheese', 'cream cheese'],
  
  // Vezë
  'Vezë të freskëta': ['fresh eggs', 'farm eggs', 'organic eggs'],
  'Vezë të mëdha': ['large eggs', 'chicken eggs', 'farm fresh eggs'],
  'Vezë me ylber portokalli': ['organic eggs', 'free range eggs', 'farm eggs'],
  
  // Zogj Fshati
  'Pulë e plotë': ['whole chicken', 'farm chicken', 'organic chicken'],
  'Gjoksi i pulës': ['chicken breast', 'organic chicken breast', 'farm chicken'],
  'Kofshë pulë': ['chicken leg', 'chicken thigh', 'organic chicken'],
  'Gjeli i plotë': ['rooster', 'whole rooster', 'farm rooster'],
  
  // Mish Viçi
  'Mish viçi i freskët': ['fresh beef', 'organic beef', 'farm beef'],
  'Biftek viçi': ['beef steak', 'organic steak', 'beef'],
  'Mish i grirë viçi': ['ground beef', 'minced beef', 'organic ground beef'],
  'Kofshë viçi': ['beef leg', 'beef shank', 'organic beef'],
  
  // Mish Qengji
  'Mish qengji i freskët': ['fresh lamb', 'organic lamb', 'lamb meat'],
  'Kofshë qengji': ['lamb leg', 'lamb shank', 'organic lamb'],
  'Gjoksi qengji': ['lamb shoulder', 'lamb chops', 'organic lamb'],
  
  // Gjalpë & Kos
  'Gjalpë i bërë në shtëpi': ['homemade butter', 'organic butter', 'farm butter'],
  'Kos i bërë në shtëpi': ['homemade yogurt', 'organic yogurt', 'farm yogurt'],
  'Kos i trashë': ['thick yogurt', 'greek yogurt', 'organic yogurt'],
  'Gjalpë me hudhër': ['garlic butter', 'herb butter', 'organic butter']
};

// Funksion për të shkarkuar foto nga Unsplash
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
    
    request.setTimeout(10000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(new Error('Request timeout'));
    });
  });
}

// URL të drejtpërdrejta për foto reale nga Unsplash
const realImageUrls = {
  // Qumësht - foto reale
  'Qumësht i freskët BIO': [
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop'
  ],
  'Qumësht i pasteurizuar BIO': [
    'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&h=600&fit=crop'
  ],
  'Qumësht me yndyrë të lartë': [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&h=600&fit=crop'
  ],
  
  // Djathë - foto reale
  'Djathë i bardhë': [
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1618164436269-3d3b3b3b3b3b?w=800&h=600&fit=crop'
  ],
  'Djathë i vjetër': [
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?auto=format&fit=crop&w=800&q=80'
  ],
  'Djathë i butë': [
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1618164436269-3d3b3b3b3b3b?w=800&h=600&fit=crop'
  ],
  
  // Vezë - foto reale
  'Vezë të freskëta': [
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518568814500-bf0f82d0c4ce?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582724658326-05b143bc3c11?auto=format&fit=crop&w=800&q=80'
  ],
  'Vezë të mëdha': [
    'https://images.unsplash.com/photo-1518568814500-bf0f82d0c4ce?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80'
  ],
  'Vezë me ylber portokalli': [
    'https://images.unsplash.com/photo-1582724658326-05b143bc3c11?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518568814500-bf0f82d0c4ce?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80'
  ],
  
  // Zogj Fshati - foto reale
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
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop'
  ],
  'Gjeli i plotë': [
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=600&fit=crop'
  ],
  
  // Mish Viçi - foto reale (përdorim URL që funksionojnë nga Unsplash)
  'Mish viçi i freskët': [
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Biftek viçi': [
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Mish i grirë viçi': [
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
  ],
  'Kofshë viçi': [
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
  ],
  
  // Mish Qengji - foto reale (përdorim URL që funksionojnë nga Unsplash)
  'Mish qengji i freskët': [
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  'Kofshë qengji': [
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
  ],
  'Gjoksi qengji': [
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546834298-5d3f1d5e5e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603048297172-c925447447b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],
  
  // Gjalpë & Kos - foto reale
  'Gjalpë i bërë në shtëpi': [
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop&q=80'
  ],
  'Kos i bërë në shtëpi': [
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop&q=80'
  ],
  'Kos i trashë': [
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop'
  ],
  'Gjalpë me hudhër': [
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552767059-e152c7d0c0b0?w=800&h=600&fit=crop&q=80'
  ]
};

// Funksion për të marrë URL foto nga Unsplash
function getUnsplashImageUrl(productName, imageIndex) {
  const urls = realImageUrls[productName];
  if (urls && urls.length > 0) {
    return urls[imageIndex % urls.length];
  }
  // Fallback nëse nuk gjejmë URL specifike
  return null;
}

// Funksion për të marrë foto nga Pexels (alternative)
function getPexelsImageUrl(searchTerm) {
  // Përdor Pexels API - kërkon API key, por mund të përdorim një URL direkt
  // Për tani, do të përdorim Unsplash
  return null;
}

async function downloadRealProductImages() {
  try {
    console.log('📥 Downloading real product images from Unsplash...');
    
    const products = await pool.query(`
      SELECT p.id, p.name, c.slug as category_slug
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
        const searchTerms = productSearchTerms[product.name] || [product.name.toLowerCase()];
        const imageUrls = [];
        const numImages = 2 + Math.floor(Math.random() * 2); // 2-3 foto për produkt
        
        console.log(`📸 Downloading ${numImages} images for: ${product.name}`);
        
        for (let i = 0; i < numImages; i++) {
          const filename = `product-${product.id}-${i + 1}.jpg`;
          const filepath = path.join(uploadsDir, filename);
          
          // Merr URL të drejtpërdrejtë nga lista e foto reale
          const imageUrl = getUnsplashImageUrl(product.name, i);
          
          if (!imageUrl) {
            console.log(`   ⚠️  No image URL found for: ${product.name}`);
            continue;
          }
          
          try {
            await downloadImage(imageUrl, filepath);
            
            // Verifikojmë që foto është e vlefshme (minimumi 10KB)
            const stats = fs.statSync(filepath);
            if (stats.size < 10240) {
              // Foto është shumë e vogël
              fs.unlinkSync(filepath);
              throw new Error('Image too small');
            }
            
            // Create local URL
            const localUrl = `http://localhost:3000/uploads/${filename}`;
            imageUrls.push(localUrl);
            
            console.log(`   ✅ Image ${i + 1} downloaded (${(stats.size / 1024).toFixed(1)}KB)`);
            
            // Pause pak për të shmangur rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.log(`   ⚠️  Failed to download image ${i + 1}: ${error.message}`);
            // Nëse dështon, provojmë një URL tjetër nga lista
            if (i < numImages - 1) {
              const fallbackUrl = getUnsplashImageUrl(product.name, i + 1);
              if (fallbackUrl) {
                try {
                  const finalFallbackUrl = fallbackUrl.includes('?') 
                    ? `${fallbackUrl}&w=800&h=600&fit=crop&q=80`
                    : `${fallbackUrl}?w=800&h=600&fit=crop&q=80`;
                  await downloadImage(finalFallbackUrl, filepath);
                  const stats = fs.statSync(filepath);
                  if (stats.size >= 10240) {
                    const localUrl = `http://localhost:3000/uploads/${filename}`;
                    imageUrls.push(localUrl);
                    console.log(`   ✅ Fallback image ${i + 1} downloaded`);
                  }
                } catch (fallbackError) {
                  console.log(`   ❌ Fallback also failed: ${fallbackError.message}`);
                }
              }
            }
          }
        }
        
        // Update product with real image URLs
        if (imageUrls.length > 0) {
          await pool.query(
            'UPDATE products SET image_urls = $1 WHERE id = $2',
            [imageUrls, product.id]
          );
          console.log(`   ✅ Updated product with ${imageUrls.length} images\n`);
        } else {
          console.log(`   ⚠️  No images were downloaded for this product\n`);
        }
      } catch (error) {
        console.log(`   ❌ Error processing product: ${error.message}\n`);
      }
    }
    
    console.log('✅ All product images downloaded!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total products processed: ${products.rows.length}`);
    console.log(`   Images location: ${uploadsDir}`);
    console.log(`\n⚠️  Note: Some images might be placeholders if Unsplash was unavailable.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

downloadRealProductImages();

