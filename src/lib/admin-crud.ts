import { NextResponse } from 'next/server';
import { dbQuery } from './db';
import { isAdmin } from './auth-server';

// A tiny CRUD factory shared by the artists / collections / banners routes.
// Column names come only from this server-defined `fields` list (never from the
// request), so building SQL with them is injection-safe; all values are parameterized.

export interface CrudField {
  col: string; // DB column (snake_case)
  key: string; // JSON body key (camelCase)
}

interface CrudConfig {
  table: string;
  fields: CrudField[];
  orderBy?: string;
}

function selectList(fields: CrudField[]) {
  return ['id', ...fields.map((f) => (f.col === f.key ? f.col : `${f.col} AS ${f.key}`))].join(', ');
}

export function createCrud({ table, fields, orderBy = 'created_at DESC' }: CrudConfig) {
  async function GET() {
    try {
      const items = await dbQuery(`SELECT ${selectList(fields)} FROM ${table} ORDER BY ${orderBy}`);
      return NextResponse.json({ items });
    } catch (error) {
      console.error(`${table} list failed:`, error);
      return NextResponse.json({ error: `Failed to load ${table}` }, { status: 500 });
    }
  }

  async function upsert(request: Request) {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    try {
      const body = await request.json();
      const id = body.id || crypto.randomUUID();
      const cols = ['id', ...fields.map((f) => f.col)];
      const values = [id, ...fields.map((f) => (body[f.key] === undefined ? null : body[f.key]))];
      const placeholders = cols.map(() => '?').join(', ');
      const updates = fields.map((f) => `${f.col} = VALUES(${f.col})`).join(', ');

      await dbQuery(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${updates}`,
        values
      );
      return NextResponse.json({ id });
    } catch (error) {
      console.error(`${table} save failed:`, error);
      return NextResponse.json({ error: `Failed to save ${table} entry` }, { status: 500 });
    }
  }

  async function DELETE(request: Request) {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    try {
      const id = new URL(request.url).searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
      }
      await dbQuery(`DELETE FROM ${table} WHERE id = ?`, [id]);
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error(`${table} delete failed:`, error);
      return NextResponse.json({ error: `Failed to delete ${table} entry` }, { status: 500 });
    }
  }

  return { GET, POST: upsert, PUT: upsert, DELETE };
}
