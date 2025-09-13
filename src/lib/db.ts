// lib/db.ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ✅ single connection string
  ssl: { rejectUnauthorized: false }, // needed if using hosted DB like Render/Heroku
});

export async function query(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    client.release();
  }
}
