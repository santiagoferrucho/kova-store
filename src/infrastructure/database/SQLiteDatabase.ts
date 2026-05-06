// Adaptador SQLite — better-sqlite3 (compatible con Vercel, Railway, etc.)
// Sin flags experimentales — funciona en cualquier entorno Node 20+
import BetterSqlite3 from 'better-sqlite3';
import path from 'path';

export type Db = BetterSqlite3.Database;

// En Vercel el filesystem es read-only excepto /tmp
const isVercel = !!process.env.VERCEL;
const DEFAULT_PATH = isVercel
  ? '/tmp/kova.db'
  : path.join(__dirname, '../../../kova.db');

const DB_PATH = process.env.DB_PATH || DEFAULT_PATH;

let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) {
    _db = new BetterSqlite3(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

export function closeDb(): void {
  if (_db) { _db.close(); _db = null; }
}

export function runTransaction<T>(db: Db, fn: () => T): T {
  const tx = db.transaction(fn);
  return tx();
}

export function initSchema(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client', created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE, description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL, description TEXT, price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0, image_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS product_categories (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    );
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      UNIQUE(cart_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending', total REAL NOT NULL,
      shipping_address TEXT NOT NULL, payment_method TEXT NOT NULL DEFAULT 'simulated',
      discount_type TEXT, discount_amount REAL DEFAULT 0, notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      name TEXT NOT NULL, price REAL NOT NULL, quantity INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(product_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('percent','fixed','volume')),
      value REAL NOT NULL, min_amount REAL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1, expires_at TEXT
    );
  `);
}
