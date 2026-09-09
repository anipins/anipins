import path from "path";
import fs from "fs";

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const USE_PG = !!process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __anipins_sqlite: any;
  // eslint-disable-next-line no-var
  var __anipins_pool: any;
}

function sqlite() {
  if (!global.__anipins_sqlite) {
    const Database = require("better-sqlite3");
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const d = new Database(path.join(dataDir, "anipins.db"));
    d.pragma("journal_mode = WAL");
    d.exec(fs.readFileSync(path.join(process.cwd(), "scripts", "schema.sql"), "utf8"));
    const userColumns = d.pragma("table_info(users)").map((c: any) => c.name);
    if (!userColumns.includes("nickname")) d.exec("ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT ''");
    if (!userColumns.includes("avatar")) d.exec("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''");
    if (!userColumns.includes("cover")) d.exec("ALTER TABLE users ADD COLUMN cover TEXT DEFAULT ''");
    if (!userColumns.includes("bio")) d.exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''");
    if (!userColumns.includes("is_public")) d.exec("ALTER TABLE users ADD COLUMN is_public INTEGER DEFAULT 1");
    const artworkColumns = d.pragma("table_info(artworks)").map((c: any) => c.name);
    if (!artworkColumns.includes("gender")) d.exec("ALTER TABLE artworks ADD COLUMN gender TEXT DEFAULT ''");
    if (!artworkColumns.includes("content_hash")) d.exec("ALTER TABLE artworks ADD COLUMN content_hash TEXT DEFAULT ''");
    if (!artworkColumns.includes("perceptual_hash")) d.exec("ALTER TABLE artworks ADD COLUMN perceptual_hash TEXT DEFAULT ''");
    global.__anipins_sqlite = d;
  }
  return global.__anipins_sqlite;
}

function pool() {
  if (!global.__anipins_pool) {
    const { Pool, types } = require("pg");
    types.setTypeParser(20, (v: string) => parseInt(v, 10)); // bigint -> number
    global.__anipins_pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return global.__anipins_pool;
}

function toPg(sql: string) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/** SELECT (or INSERT..RETURNING) — returns all rows */
export async function rows(sql: string, ...args: any[]): Promise<any[]> {
  if (USE_PG) return (await pool().query(toPg(sql), args)).rows;
  return sqlite().prepare(sql).all(...args);
}

/** Single row or null */
export async function row(sql: string, ...args: any[]): Promise<any | null> {
  const r = await rows(sql, ...args);
  return r[0] ?? null;
}

/** Statement with no result set */
export async function run(sql: string, ...args: any[]): Promise<void> {
  if (USE_PG) { await pool().query(toPg(sql), args); return; }
  sqlite().prepare(sql).run(...args);
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
