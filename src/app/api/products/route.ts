import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { isAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

interface ProductInput {
  title: string;
  slug?: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  salePrice: number | null;
  stock: number;
  sku: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featuredImage: string;
  categoryId: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  tags?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  salePrice: number | null;
  discount: number;
  stock: number;
  sku: string;
  status: string;
  featuredImage: string;
  categoryId: string;
  categoryName: string;
  featured: number | boolean;
  newArrival: number | boolean;
  bestSeller: number | boolean;
  tags: string[] | string | null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categoryNameFromSlug(slug: string) {
  const names: Record<string, string> = {
    bharni: 'Bharni Style',
    kachni: 'Kachni Style',
    godna: 'Godna Style',
  };

  return names[slug] || 'Heritage Art';
}

async function ensureCategoryId(categorySlug: string) {
  const slug = categorySlug || 'bharni';
  const rows = await dbQuery<CategoryRow[]>(
    'SELECT id, name FROM categories WHERE slug = ? OR id = ? LIMIT 1',
    [slug, slug]
  );

  if (rows[0]) return rows[0].id;

  await dbQuery(
    'INSERT INTO categories (id, name, slug, description, image) VALUES (?, ?, ?, ?, ?)',
    [slug, categoryNameFromSlug(slug), slug, 'Mithila painting collection', null]
  );

  return slug;
}

function normalizeProductInput(body: Partial<ProductInput>): ProductInput {
  const title = body.title?.trim() || '';
  return {
    title,
    slug: body.slug?.trim() || slugify(title),
    shortDescription: body.shortDescription?.trim() || '',
    longDescription: body.longDescription?.trim() || body.shortDescription?.trim() || '',
    price: Number(body.price || 0),
    salePrice: body.salePrice === null || body.salePrice === undefined || Number.isNaN(Number(body.salePrice)) ? null : Number(body.salePrice),
    stock: Number(body.stock || 0),
    sku: body.sku?.trim() || `MHG-${Date.now()}`,
    status: body.status || 'PUBLISHED',
    featuredImage: body.featuredImage?.trim() || '',
    categoryId: body.categoryId || 'bharni',
    featured: !!body.featured,
    newArrival: !!body.newArrival,
    bestSeller: !!body.bestSeller,
    tags: body.tags || [],
    seoTitle: body.seoTitle || null,
    seoDescription: body.seoDescription || null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';

    // Check if products table exists by querying it
    let products: ProductRow[] = [];
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
          c.slug AS categoryId, 
          c.name AS categoryName,
          p.featured, p.new_arrival AS newArrival, 
          p.best_seller AS bestSeller, p.tags
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'PUBLISHED'
      `;
      const params: Array<string | number> = [];

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
      console.warn('MySQL products query failed:', dbError);
      products = [];
    }

    if (slug) {
      return products[0]
        ? NextResponse.json({ product: products[0] })
        : NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const product = normalizeProductInput(await request.json());
    if (!product.title || !product.shortDescription || !product.longDescription || !product.featuredImage) {
      return NextResponse.json({ error: 'Title, descriptions, and featured image are required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const categoryId = await ensureCategoryId(product.categoryId);

    await dbQuery(
      `INSERT INTO products (
        id, title, slug, short_description, long_description, price, sale_price, discount,
        stock, sku, status, featured_image, category_id, featured, new_arrival,
        best_seller, tags, seo_title, seo_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        product.title,
        product.slug,
        product.shortDescription,
        product.longDescription,
        product.price,
        product.salePrice,
        product.salePrice ? Math.max(0, Math.round(((product.price - product.salePrice) / product.price) * 100)) : 0,
        product.stock,
        product.sku,
        product.status,
        product.featuredImage,
        categoryId,
        product.featured ? 1 : 0,
        product.newArrival ? 1 : 0,
        product.bestSeller ? 1 : 0,
        JSON.stringify(product.tags),
        product.seoTitle,
        product.seoDescription,
      ]
    );

    return NextResponse.json({ product: { id, ...product } }, { status: 201 });
  } catch (error) {
    console.error('Product create failed:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    const product = normalizeProductInput(body);
    if (!product.title || !product.shortDescription || !product.longDescription || !product.featuredImage) {
      return NextResponse.json({ error: 'Title, descriptions, and featured image are required' }, { status: 400 });
    }

    const categoryId = await ensureCategoryId(product.categoryId);

    await dbQuery(
      `UPDATE products SET
        title = ?, slug = ?, short_description = ?, long_description = ?, price = ?,
        sale_price = ?, discount = ?, stock = ?, sku = ?, status = ?, featured_image = ?,
        category_id = ?, featured = ?, new_arrival = ?, best_seller = ?, tags = ?,
        seo_title = ?, seo_description = ?
       WHERE id = ?`,
      [
        product.title,
        product.slug,
        product.shortDescription,
        product.longDescription,
        product.price,
        product.salePrice,
        product.salePrice ? Math.max(0, Math.round(((product.price - product.salePrice) / product.price) * 100)) : 0,
        product.stock,
        product.sku,
        product.status,
        product.featuredImage,
        categoryId,
        product.featured ? 1 : 0,
        product.newArrival ? 1 : 0,
        product.bestSeller ? 1 : 0,
        JSON.stringify(product.tags),
        product.seoTitle,
        product.seoDescription,
        body.id,
      ]
    );

    return NextResponse.json({ product: { id: body.id, ...product } });
  } catch (error) {
    console.error('Product update failed:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
    }

    await dbQuery('UPDATE products SET status = ? WHERE id = ?', ['ARCHIVED', id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Product archive failed:', error);
    return NextResponse.json({ error: 'Failed to archive product' }, { status: 500 });
  }
}
