import mysql from 'mysql2/promise';

// Establish a connection pool to MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'madhubani_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Execute parameterized raw SQL queries against the MySQL connection pool.
 * Prevents SQL injections and guarantees connection cleanup.
 */
export async function dbQuery<T = any>(sql: string, params?: any[]): Promise<T> {
  try {
    const [results] = await pool.execute(sql, params);
    return results as T;
  } catch (error: any) {
    console.error(`Database query failed: ${error.message} \nQuery: ${sql}`);
    throw new Error(`Database execution error: ${error.message}`);
  }
}

export default pool;
