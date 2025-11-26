const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ('admin@fshatibio.com', $1, 'Admin', 'FshatiBio', 'admin')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [adminPassword]
    );

    if (adminResult.rows.length > 0) {
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create categories
    const categories = [
      { name: 'Qumësht', slug: 'qumesht', description: 'Qumësht i freskët BIO', display_order: 1 },
      { name: 'Djathë', slug: 'djathe', description: 'Djathë i bërë në shtëpi', display_order: 2 },
      { name: 'Vezë', slug: 'veze', description: 'Vezë të freskëta nga pulat e fshatit', display_order: 3 },
      { name: 'Zogj Fshati', slug: 'zogj-fshati', description: 'Pula dhe zogj të rritur në natyrë', display_order: 4 },
      { name: 'Mish Viçi', slug: 'mish-vici', description: 'Mish viçi i freskët', display_order: 5 },
      { name: 'Mish Qengji', slug: 'mish-qengji', description: 'Mish qengji i freskët', display_order: 6 },
      { name: 'Gjalpë & Kos', slug: 'gjaltpe-kos', description: 'Gjalpë dhe kos i bërë në shtëpi', display_order: 7 }
    ];

    for (const category of categories) {
      await pool.query(
        `INSERT INTO categories (name, slug, description, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO NOTHING`,
        [category.name, category.slug, category.description, category.display_order]
      );
    }
    console.log('✅ Categories created');

    // Helper function to get product image URLs - using professional SVG images
    function getProductImageUrls(categorySlug, productName) {
      // Create professional-looking SVG images with category colors and icons
      const categoryStyles = {
        'qumesht': { bg: '#e8f5e9', text: '#2e7d32', icon: '🥛' },
        'djathe': { bg: '#fff9e6', text: '#8b6914', icon: '🧀' },
        'veze': { bg: '#fff8e1', text: '#ff9800', icon: '🥚' },
        'zogj-fshati': { bg: '#ffebee', text: '#f44336', icon: '🐔' },
        'mish-vici': { bg: '#ffebee', text: '#d32f2f', icon: '🥩' },
        'mish-qengji': { bg: '#ffebee', text: '#c62828', icon: '🍖' },
        'gjaltpe-kos': { bg: '#fff9c4', text: '#ffc107', icon: '🧈' }
      };
      
      const style = categoryStyles[categorySlug] || { bg: '#e0e0e0', text: '#666666', icon: '📦' };
      
      // Create SVG with product name and icon
      const svg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${style.bg};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${style.bg}dd;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#grad)"/>
          <text x="400" y="250" font-size="100" text-anchor="middle" fill="${style.text}" font-family="Arial, sans-serif" font-weight="bold">${style.icon}</text>
          <text x="400" y="350" font-size="32" text-anchor="middle" fill="${style.text}" font-family="Arial, sans-serif" font-weight="bold">${productName}</text>
          <text x="400" y="400" font-size="20" text-anchor="middle" fill="${style.text}aa" font-family="Arial, sans-serif">✓ BIO Produkt</text>
        </svg>
      `.trim();
      
      // Return as data URI
      const base64 = Buffer.from(svg).toString('base64');
      return [`data:image/svg+xml;base64,${base64}`];
    }

    // Get category IDs for products
    const categoryResult = await pool.query('SELECT id, slug FROM categories');
    const categoryMap = {};
    categoryResult.rows.forEach(row => {
      categoryMap[row.slug] = row.id;
    });

    // Create sample products
    const products = [
      // Qumësht
      {
        name: 'Qumësht i freskët BIO',
        category_slug: 'qumesht',
        description: 'Qumësht i freskët BIO nga lopët e rritura në natyrë. I mbledhur çdo ditë dhe i dorëzuar i freskët.',
        price: 150,
        unit: 'liter',
        stock_quantity: 50,
        is_bio: true,
        freshness_period: 3,
        origin: 'Fshati i Dajtit, Tiranë'
      },
      {
        name: 'Qumësht i pasteurizuar BIO',
        category_slug: 'qumesht',
        description: 'Qumësht i pasteurizuar BIO, i sigurt për konsum. Ruajtje më e gjatë.',
        price: 160,
        unit: 'liter',
        stock_quantity: 30,
        is_bio: true,
        freshness_period: 7,
        origin: 'Fshati i Dajtit, Tiranë'
      },
      {
        name: 'Qumësht me yndyrë të lartë',
        category_slug: 'qumesht',
        description: 'Qumësht me përmbajtje të lartë yndyre, ideal për djathë dhe gjalpë.',
        price: 170,
        unit: 'liter',
        stock_quantity: 25,
        is_bio: true,
        freshness_period: 3,
        origin: 'Korçë'
      },
      // Djathë
      {
        name: 'Djathë i bardhë',
        category_slug: 'djathe',
        description: 'Djathë i bardhë i bërë me recetë tradicionale. Shumë i shijshëm dhe i freskët.',
        price: 800,
        unit: 'kg',
        stock_quantity: 20,
        is_bio: true,
        freshness_period: 7,
        origin: 'Shkodër'
      },
      {
        name: 'Djathë i vjetër',
        category_slug: 'djathe',
        description: 'Djathë i vjetër 6 muaj, me shije intensive dhe teksturë të fortë.',
        price: 1200,
        unit: 'kg',
        stock_quantity: 15,
        is_bio: true,
        freshness_period: 30,
        origin: 'Shkodër'
      },
      {
        name: 'Djathë i butë',
        category_slug: 'djathe',
        description: 'Djathë i butë i freskët, ideal për bukë dhe salata.',
        price: 750,
        unit: 'kg',
        stock_quantity: 18,
        is_bio: true,
        freshness_period: 5,
        origin: 'Korçë'
      },
      // Vezë
      {
        name: 'Vezë të freskëta',
        category_slug: 'veze',
        description: 'Vezë të freskëta nga pulat e rritura në natyrë. Të mbledhura çdo ditë.',
        price: 20,
        unit: 'piece',
        stock_quantity: 100,
        is_bio: true,
        freshness_period: 14,
        origin: 'Fshati i Dajtit'
      },
      {
        name: 'Vezë të mëdha',
        category_slug: 'veze',
        description: 'Vezë të mëdha me ylber të fortë dhe të shijshme.',
        price: 25,
        unit: 'piece',
        stock_quantity: 80,
        is_bio: true,
        freshness_period: 14,
        origin: 'Kavajë'
      },
      {
        name: 'Vezë me ylber portokalli',
        category_slug: 'veze',
        description: 'Vezë me ylber të portokalltë, shenjë e ushqimit të natyrshëm.',
        price: 22,
        unit: 'piece',
        stock_quantity: 60,
        is_bio: true,
        freshness_period: 14,
        origin: 'Durrës'
      },
      // Zogj Fshati
      {
        name: 'Pulë e plotë',
        category_slug: 'zogj-fshati',
        description: 'Pulë e plotë e rritur në natyrë, pa antibiotikë dhe ushqim artificial.',
        price: 1200,
        unit: 'kg',
        stock_quantity: 15,
        is_bio: true,
        freshness_period: 2,
        origin: 'Kavajë'
      },
      {
        name: 'Gjoksi i pulës',
        category_slug: 'zogj-fshati',
        description: 'Gjoksi i pulës i prerë, i pastër dhe i freskët.',
        price: 1400,
        unit: 'kg',
        stock_quantity: 20,
        is_bio: true,
        freshness_period: 2,
        origin: 'Kavajë'
      },
      {
        name: 'Kofshë pulë',
        category_slug: 'zogj-fshati',
        description: 'Kofshë pulë të freskëta, ideale për pjekje dhe skarë.',
        price: 1300,
        unit: 'kg',
        stock_quantity: 18,
        is_bio: true,
        freshness_period: 2,
        origin: 'Kavajë'
      },
      {
        name: 'Gjeli i plotë',
        category_slug: 'zogj-fshati',
        description: 'Gjeli i plotë i rritur në natyrë, me mish të fortë dhe të shijshëm.',
        price: 1500,
        unit: 'kg',
        stock_quantity: 10,
        is_bio: true,
        freshness_period: 2,
        origin: 'Korçë'
      },
      // Mish Viçi
      {
        name: 'Mish viçi i freskët',
        category_slug: 'mish-vici',
        description: 'Mish viçi i freskët, i prerë dhe i paketuar me kujdes.',
        price: 1800,
        unit: 'kg',
        stock_quantity: 30,
        is_bio: true,
        freshness_period: 3,
        origin: 'Korçë'
      },
      {
        name: 'Biftek viçi',
        category_slug: 'mish-vici',
        description: 'Biftek viçi i zgjedhur, ideal për skarë dhe pjekje.',
        price: 2200,
        unit: 'kg',
        stock_quantity: 15,
        is_bio: true,
        freshness_period: 3,
        origin: 'Korçë'
      },
      {
        name: 'Mish i grirë viçi',
        category_slug: 'mish-vici',
        description: 'Mish i grirë viçi i freskët, ideal për qofte dhe hamburger.',
        price: 1900,
        unit: 'kg',
        stock_quantity: 25,
        is_bio: true,
        freshness_period: 2,
        origin: 'Korçë'
      },
      {
        name: 'Kofshë viçi',
        category_slug: 'mish-vici',
        description: 'Kofshë viçi me kockë, ideale për zierje dhe pjekje.',
        price: 1700,
        unit: 'kg',
        stock_quantity: 20,
        is_bio: true,
        freshness_period: 3,
        origin: 'Korçë'
      },
      // Mish Qengji
      {
        name: 'Mish qengji i freskët',
        category_slug: 'mish-qengji',
        description: 'Mish qengji i freskët, i butë dhe i shijshëm.',
        price: 2000,
        unit: 'kg',
        stock_quantity: 20,
        is_bio: true,
        freshness_period: 3,
        origin: 'Shkodër'
      },
      {
        name: 'Kofshë qengji',
        category_slug: 'mish-qengji',
        description: 'Kofshë qengji me kockë, ideale për pjekje dhe skarë.',
        price: 2100,
        unit: 'kg',
        stock_quantity: 15,
        is_bio: true,
        freshness_period: 3,
        origin: 'Shkodër'
      },
      {
        name: 'Gjoksi qengji',
        category_slug: 'mish-qengji',
        description: 'Gjoksi qengji i prerë, i butë dhe i shijshëm.',
        price: 2200,
        unit: 'kg',
        stock_quantity: 12,
        is_bio: true,
        freshness_period: 3,
        origin: 'Shkodër'
      },
      // Gjalpë & Kos
      {
        name: 'Gjalpë i bërë në shtëpi',
        category_slug: 'gjaltpe-kos',
        description: 'Gjalpë i bërë me metodë tradicionale nga qumësht i pastër.',
        price: 600,
        unit: 'kg',
        stock_quantity: 25,
        is_bio: true,
        freshness_period: 10,
        origin: 'Shkodër'
      },
      {
        name: 'Kos i bërë në shtëpi',
        category_slug: 'gjaltpe-kos',
        description: 'Kos i bërë me metodë tradicionale, me shije të natyrshme.',
        price: 200,
        unit: 'liter',
        stock_quantity: 40,
        is_bio: true,
        freshness_period: 5,
        origin: 'Korçë'
      },
      {
        name: 'Kos i trashë',
        category_slug: 'gjaltpe-kos',
        description: 'Kos i trashë dhe i shijshëm, ideal për përdorim në gatim.',
        price: 220,
        unit: 'liter',
        stock_quantity: 30,
        is_bio: true,
        freshness_period: 5,
        origin: 'Korçë'
      },
      {
        name: 'Gjalpë me hudhër',
        category_slug: 'gjaltpe-kos',
        description: 'Gjalpë me hudhër të freskët, i përgatitur me recetë tradicionale.',
        price: 650,
        unit: 'kg',
        stock_quantity: 15,
        is_bio: true,
        freshness_period: 7,
        origin: 'Shkodër'
      }
    ];

    for (const product of products) {
      const slug = product.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Generate image URLs based on product category
      const imageUrls = getProductImageUrls(product.category_slug, product.name);
      
      await pool.query(
        `INSERT INTO products (
          name, slug, description, category_id, price, unit,
          stock_quantity, is_bio, freshness_period, origin, image_urls
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[])
        ON CONFLICT (slug) DO UPDATE SET
          image_urls = EXCLUDED.image_urls,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          stock_quantity = EXCLUDED.stock_quantity`,
        [
          product.name,
          slug,
          product.description,
          categoryMap[product.category_slug],
          product.price,
          product.unit,
          product.stock_quantity,
          product.is_bio,
          product.freshness_period,
          product.origin || null,
          imageUrls  // Pass array directly, PostgreSQL will handle it
        ]
      );
    }
    console.log('✅ Sample products created');

    // Create sample banners with different offers
    const banners = [
      {
        title: 'Oferta e javës - Produkte BIO të freskëta!',
        image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop',
        link_url: '/products',
        display_order: 1
      },
      {
        title: 'Zbritje 20% për të gjitha produktet e qumështit!',
        image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&h=400&fit=crop',
        link_url: '/products?category=qumesht',
        display_order: 2
      },
      {
        title: 'Djathë i freskët nga fermerët lokal - Porosit tani!',
        image_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=1200&h=400&fit=crop',
        link_url: '/products?category=djathe',
        display_order: 3
      },
      {
        title: 'Vezë të freskëta çdo ditë - Direkt nga ferma!',
        image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=1200&h=400&fit=crop',
        link_url: '/products?category=veze',
        display_order: 4
      },
      {
        title: 'Mish i freskët BIO - Porosit për javën e ardhshme!',
        image_url: 'https://images.unsplash.com/photo-1603048297172-c925447447b6?w=1200&h=400&fit=crop',
        link_url: '/products',
        display_order: 5
      },
      {
        title: 'Zogj fshati - Shije autentike dhe natyrale!',
        image_url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1200&h=400&fit=crop',
        link_url: '/products?category=zogj-fshati',
        display_order: 6
      },
      {
        title: 'Gjalpë dhe Kos i bërë në shtëpi - Cilësi maksimale!',
        image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&h=400&fit=crop',
        link_url: '/products?category=gjaltpe-kos',
        display_order: 7
      },
      {
        title: 'Dërgesë falas për porosi mbi 2000 L!',
        image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop',
        link_url: '/products',
        display_order: 8
      },
      {
        title: 'Produkte të reja çdo javë - Shiko koleksionin e ri!',
        image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=1200&h=400&fit=crop',
        link_url: '/products',
        display_order: 9
      }
    ];

    for (const banner of banners) {
      await pool.query(
        `INSERT INTO banners (title, image_url, link_url, display_order, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT DO NOTHING`,
        [banner.title, banner.image_url, banner.link_url, banner.display_order]
      );
    }
    console.log(`✅ ${banners.length} banners created`);

    console.log('🎉 Database seed completed successfully!');
    console.log('\n📝 Default credentials:');
    console.log('   Email: admin@fshatibio.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  Please change the admin password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();

