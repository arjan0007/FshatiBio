const { pool } = require('../config/database');

// Using Unsplash images with specific IDs for banners
const bannerImages = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop', // Organic food
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&h=400&fit=crop', // Milk
  'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=1200&h=400&fit=crop', // Cheese
  'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=1200&h=400&fit=crop', // Eggs
  'https://images.unsplash.com/photo-1603048297172-c925447447b6?w=1200&h=400&fit=crop', // Meat
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1200&h=400&fit=crop', // Poultry
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&h=400&fit=crop', // Dairy
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop', // Delivery
  'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=1200&h=400&fit=crop'  // Fresh
];

async function addBanners() {
  try {
    console.log('🎨 Adding banners...');

    // Delete existing banners first
    await pool.query('DELETE FROM banners');
    console.log('🗑️  Cleared existing banners');

    const banners = [
      {
        title: 'Oferta e javës - Produkte BIO të freskëta!',
        image_url: bannerImages[0],
        link_url: '/products',
        display_order: 1
      },
      {
        title: 'Zbritje 20% - Qumësht dhe Produkte Dairi!',
        image_url: bannerImages[1],
        link_url: '/products?category=qumesht',
        display_order: 2
      },
      {
        title: 'Djathë i freskët - Direkt nga fermerët lokal!',
        image_url: bannerImages[2],
        link_url: '/products?category=djathe',
        display_order: 3
      },
      {
        title: 'Vezë të freskëta - Porosit çdo ditë!',
        image_url: bannerImages[3],
        link_url: '/products?category=veze',
        display_order: 4
      },
      {
        title: 'Mish BIO i freskët - Cilësi maksimale!',
        image_url: bannerImages[4],
        link_url: '/products',
        display_order: 5
      },
      {
        title: 'Zogj Fshati - Shije autentike!',
        image_url: bannerImages[5],
        link_url: '/products?category=zogj-fshati',
        display_order: 6
      },
      {
        title: 'Gjalpë & Kos - Bërë në shtëpi!',
        image_url: bannerImages[6],
        link_url: '/products?category=gjaltpe-kos',
        display_order: 7
      },
      {
        title: 'Dërgesë Falas - Për porosi mbi 2000 L!',
        image_url: bannerImages[7],
        link_url: '/products',
        display_order: 8
      },
      {
        title: 'Produkte të Reja - Shiko koleksionin e ri!',
        image_url: bannerImages[8],
        link_url: '/products',
        display_order: 9
      }
    ];

    for (const banner of banners) {
      await pool.query(
        `INSERT INTO banners (title, image_url, link_url, display_order, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [banner.title, banner.image_url, banner.link_url, banner.display_order]
      );
    }

    console.log(`✅ ${banners.length} banners added successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding banners:', error);
    process.exit(1);
  }
}

addBanners();

