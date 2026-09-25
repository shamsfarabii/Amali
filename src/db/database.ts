import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'duas.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Opens the database once and runs pending migrations. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open().catch((error) => {
      dbPromise = null; // allow a retry after a failure
      throw error;
    });
  }
  return dbPromise;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

/**
 * Each entry upgrades the schema by one version. Append new migrations; never edit old ones.
 * Every step runs in its own transaction together with the version bump.
 */
const MIGRATIONS: string[] = [
  // 1: initial schema
  `
  CREATE TABLE IF NOT EXISTS duas (
    id         TEXT PRIMARY KEY NOT NULL,
    arabic     TEXT NOT NULL,
    bengali    TEXT NOT NULL,
    source     TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  // 2: titles, pronunciation and folders
  `
  ALTER TABLE duas ADD COLUMN title TEXT NOT NULL DEFAULT '';
  ALTER TABLE duas ADD COLUMN pronunciation TEXT NOT NULL DEFAULT '';
  ALTER TABLE duas ADD COLUMN folder_id TEXT;
  CREATE TABLE IF NOT EXISTS folders (
    id         TEXT PRIMARY KEY NOT NULL,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_duas_folder ON duas (folder_id);
  `,
];

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
