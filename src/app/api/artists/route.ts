import { createCrud } from '@/lib/admin-crud';

export const dynamic = 'force-dynamic';

export const { GET, POST, PUT, DELETE } = createCrud({
  table: 'artists',
  fields: [
    { col: 'name', key: 'name' },
    { col: 'slug', key: 'slug' },
    { col: 'bio', key: 'bio' },
    { col: 'image', key: 'image' },
    { col: 'active', key: 'active' },
  ],
  orderBy: 'name ASC',
});
