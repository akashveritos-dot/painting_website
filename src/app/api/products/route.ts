import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

const FALLBACK_PRODUCTS = [
  {
    id: 'prod-peacock-uuid-001',
    title: 'The Celestial Peacock (Mayura)',
    slug: 'celestial-peacock',
    shortDescription: 'Vibrant peacock rendered in classical Mithila Bharni style.',
    longDescription: 'A gorgeous Mayura (peacock) hand-painted using natural dyes on handmade paper. The Bharni style fills the shapes with deep vermillion, turmeric yellow, and indigo blue. Embellished with traditional floral borders. Includes certificate of authenticity.',
    price: 240.00,
    salePrice: 195.00,
    discount: 18,
    stock: 4,
    sku: 'MHG-PEA-001',
    status: 'PUBLISHED',
    featuredImage: '/assets/images/celestial_peacock.png',
    categoryId: 'bharni',
    categoryName: 'Bharni Style',
    featured: true,
    newArrival: true,
    bestSeller: false,
    tags: ['peacock', 'nature', 'bharni', 'home-decor'],
    seoTitle: 'The Celestial Peacock Madhubani Painting | Mithila Art',
    seoDescription: 'Hand-painted celestial peacock Madhubani painting in traditional Bharni style.',
  },
  {
    id: 'prod-fish-uuid-002',
    title: 'Fish (Matsya) of Abundance',
    slug: 'matsya-fish',
    shortDescription: 'Intricate Kachni line art depicting prosperity and fertility.',
    longDescription: 'A traditional painting focusing on the Matsya (fish) motif, which symbolizes wealth and fertility in Mithila culture. Drawn using fine double outlines and close parallel hatching (Kachni style) with terracotta and ochre pigments.',
    price: 180.00,
    salePrice: null,
    discount: 0,
    stock: 7,
    sku: 'MHG-FIS-002',
    status: 'PUBLISHED',
    featuredImage: '/assets/images/matsya_fish.png',
    categoryId: 'kachni',
    categoryName: 'Kachni Style',
    featured: true,
    newArrival: false,
    bestSeller: true,
    tags: ['fish', 'matsya', 'kachni', 'prosperity'],
    seoTitle: 'Fish of Abundance Madhubani Painting | Mithila Line Art',
    seoDescription: 'Intricate Kachni line-art Madhubani painting of fish, representing abundance.',
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';

    // Check if products table exists by querying it
    let products: any[] = [];
    try {
      let queryStr = `
        SELECT 
          p.id, p.title, p.slug, 
          p.short_description AS shortDescription, 
          p.long_description AS longDescription, 
          CAST(p.price AS DOUBLE) AS price, 
          CAST(p.sale_price AS DOUBLE) AS salePrice, 
          p.discount, p.stock, p.sku, p.status, 
          p.featured_image AS featuredImage, 
          p.category_id AS categoryId, 
          c.name AS categoryName,
          p.featured, p.new_arrival AS newArrival, 
          p.best_seller AS bestSeller, p.tags
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'PUBLISHED'
      `;
      const params: any[] = [];

      if (slug) {
        queryStr += ' AND p.slug = ?';
        params.push(slug);
      }
      if (category) {
        queryStr += ' AND c.slug = ?';
        params.push(category);
      }
      if (featured) {
        queryStr += ' AND p.featured = ?';
        params.push(1);
      }

      products = await dbQuery(queryStr, params);
      
      // Parse JSON tags
      products = products.map(p => ({
        ...p,
        featured: !!p.featured,
        newArrival: !!p.newArrival,
        bestSeller: !!p.bestSeller,
        tags: p.tags ? (typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags) : []
      }));

    } catch (dbError) {
      console.warn('MySQL products query failed, using static fallback:', dbError);
      products = [];
    }

    // Fallback to static seed data if database is empty
    if (products.length === 0) {
      if (slug) {
        const single = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
        return NextResponse.json(single ? { product: single } : { error: 'Product not found' }, { status: single ? 200 : 404 });
      }

      let filtered = FALLBACK_PRODUCTS;
      if (category) {
        filtered = filtered.filter((p) => p.categoryId === category);
      }
      if (featured) {
        filtered = filtered.filter((p) => p.featured);
      }

      return NextResponse.json({ products: filtered });
    }

    if (slug) {
      return NextResponse.json({ product: products[0] });
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
  }
}
