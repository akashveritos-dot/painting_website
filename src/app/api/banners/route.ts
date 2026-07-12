import { createCrud } from '@/lib/admin-crud';

export const dynamic = 'force-dynamic';

export const { GET, POST, PUT, DELETE } = createCrud({
  table: 'banners',
  fields: [
    { col: 'title', key: 'title' },
    { col: 'subtitle', key: 'subtitle' },
    { col: 'image', key: 'image' },
    { col: 'link_url', key: 'linkUrl' },
    { col: 'active', key: 'active' },
    { col: 'sort_order', key: 'sortOrder' },
  ],
  orderBy: 'sort_order ASC',
});
