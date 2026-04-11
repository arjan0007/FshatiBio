// Update product images with real food photos from Unsplash
const { pool } = require('./src/config/database');

// Real Unsplash photo IDs for Albanian organic food categories
const categoryImages = {
  'qumesht': [
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80', // milk bottle
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80', // milk glass
    'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80', // dairy
  ],
  'djathe': [
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a2d0?w=800&q=80', // cheese
    'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=800&q=80', // cheese board
    'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=800&q=80', // white cheese
  ],
  'veze': [
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80', // eggs
    'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800&q=80', // brown eggs
    'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=800&q=80', // farm eggs
  ],
  'zogj-fshati': [
    'https://images.unsplash.com/photo-1501200291289-c5a76c232e5f?w=800&q=80', // chicken farm
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80', // roasted chicken
    'https://images.unsplash.com/photo-1588347818036-4b8b0d6c2b48?w=800&q=80', // free range
  ],
  'mish-vici': [
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80', // beef steak
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80', // raw beef
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', // meat
  ],
  'mish-qengji': [
    'https://images.unsplash.com/photo-1602473773312-100e0b02be64?w=800&q=80', // lamb
    'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80', // lamb chops
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80', // lamb dish
  ],
  'gjaltpe-kos': [
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80', // butter
    'https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=800&q=80', // yogurt
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80', // dairy
  ],
};

async function updateImages() {
  try {
    console.log('🖼️  Updating product images...');

    const products = await pool.query(`
      SELECT p.id, p.name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY c.slug, p.name
    `);

    const categoryCounters = {};

    for (const product of products.rows) {
      const slug = product.category_slug;
      const images = categoryImages[slug] || categoryImages['qumesht'];

      if (!categoryCounters[slug]) categoryCounters[slug] = 0;
      const imgIndex = categoryCounters[slug] % images.length;
      const imageUrl = images[imgIndex];
      categoryCounters[slug]++;

      await pool.query(
        `UPDATE products SET image_urls = $1 WHERE id = $2`,
        [[imageUrl], product.id]
      );
      console.log(`✅ ${product.name} → ${imageUrl.substring(0, 60)}...`);
    }

    // Also add more bio products with variety
    const catResult = await pool.query('SELECT id, slug FROM categories');
    const catMap = {};
    catResult.rows.forEach(r => catMap[r.slug] = r.id);

    const extraProducts = [
      {
        name: 'Mjaltë Lule Bore',
        category_slug: 'gjaltpe-kos',
        description: 'Mjaltë i pastër nga lulëzimi i borës në alpet shqiptare. Aromë e veçantë dhe shije delikate.',
        price: 1500,
        unit: 'kg',
        stock: 10,
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
      },
      {
        name: 'Krem djathi',
        category_slug: 'djathe',
        description: 'Krem djathi i butë dhe i bardhë. Ideal për sanduiçe dhe salca.',
        price: 600,
        unit: 'kg',
        stock: 15,
        image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=800&q=80',
      },
      {
        name: 'Qumësht dhie BIO',
        category_slug: 'qumesht',
        description: 'Qumësht i freskët dhie, me veti ushqyese të veçanta. Ideal për persona me intolerancë ndaj laktozës.',
        price: 200,
        unit: 'liter',
        stock: 20,
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80',
      },
      {
        name: 'Veza organike (kuti 12)',
        category_slug: 'veze',
        description: 'Vezë organike nga pulat e lira. 12 copë në kuti. Pa antibiotikë dhe hormone.',
        price: 500,
        unit: 'piece',
        stock: 30,
        image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80',
      },
      {
        name: 'Pule fshati (e tërë)',
        category_slug: 'zogj-fshati',
        description: 'Pulë fshati e rritur lirshëm, pa shtesa kimike. Mish i shijshëm dhe i shëndetshëm.',
        price: 1800,
        unit: 'piece',
        stock: 8,
        image: 'https://images.unsplash.com/photo-1501200291289-c5a76c232e5f?w=800&q=80',
      },
    ];

    for (const p of extraProducts) {
      const catId = catMap[p.category_slug];
      if (!catId) continue;

      const slug = p.name.toLowerCase()
        .replace(/[àáâã]/g, 'a').replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i').replace(/[òóôõ]/g, 'o')
        .replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
        .replace(/[ë]/g, 'e').replace(/ë/g, 'e')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      await pool.query(`
        INSERT INTO products (name, slug, description, price, unit, stock_quantity, category_id, image_urls, is_bio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (slug) DO NOTHING
      `, [p.name, slug + '-extra', p.description, p.price, p.unit, p.stock,
          catId, [p.image]]);
      console.log(`➕ Added extra product: ${p.name}`);
    }

    console.log('\n✅ All done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateImages();
