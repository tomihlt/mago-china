import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('imm.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS PRODUCTS (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name    TEXT NOT NULL,
      product_code     TEXT UNIQUE NOT NULL,
      description      TEXT,
      price            REAL DEFAULT 0.0,
      units_per_package INTEGER DEFAULT 1,
      volume           REAL DEFAULT 0.0,
      weight           REAL DEFAULT 0.0,
      observations     TEXT,
      image_uri        TEXT NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS SYSTEM_CONFIG (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key   TEXT UNIQUE NOT NULL,
      config_value TEXT NOT NULL,
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO SYSTEM_CONFIG (config_key, config_value)
    VALUES ('product_code_sequence', '1');

    INSERT OR IGNORE INTO SYSTEM_CONFIG (config_key, config_value)
    VALUES ('product_code_prefix', 'EM-');

    INSERT OR IGNORE INTO SYSTEM_CONFIG (config_key, config_value)
    VALUES ('theme_mode', 'system');
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
