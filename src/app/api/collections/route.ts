import { createCrud } from '@/lib/admin-crud';

export const dynamic = 'force-dynamic';

export const { GET, POST, PUT, DELETE } = createCrud({
  table: 'collections',
  fields: [
    { col: 'name', key: 'name' },
    { col: 'slug', key: 'slug' },
    { col: 'description', key: 'description' },
    { col: 'image', key: 'image' },
    { col: 'active', key: 'active' },
  ],
  orderBy: 'name ASC',
});
