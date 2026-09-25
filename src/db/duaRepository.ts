import type { SQLiteDatabase } from 'expo-sqlite';
import type { Dua, DuaInput } from '@/types/dua';
import type { Folder } from '@/types/folder';
import type { ImportMode, ImportPlan } from '@/backup/planImport';
import { newId } from '@/utils/id';
import { getDatabase } from './database';

interface DuaRow {
  id: string;
  title: string;
  arabic: string;
  pronunciation: string;
  bengali: string;
  source: string;
  folder_id: string | null;
  created_at: number;
  updated_at: number;
}

interface FolderRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

function duaFromRow(row: DuaRow): Dua {
  return {
    id: row.id,
    title: row.title,
    arabic: row.arabic,
    pronunciation: row.pronunciation,
    bengali: row.bengali,
    source: row.source,
    folderId: row.folder_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function folderFromRow(row: FolderRow): Folder {
  return { id: row.id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at };
}

async function insertDua(db: SQLiteDatabase, dua: Dua): Promise<void> {
  await db.runAsync(
    `INSERT INTO duas (id, title, arabic, pronunciation, bengali, source, folder_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    dua.id,
    dua.title,
    dua.arabic,
    dua.pronunciation,
    dua.bengali,
    dua.source,
    dua.folderId,
    dua.createdAt,
    dua.updatedAt,
  );
}

async function overwriteDua(db: SQLiteDatabase, dua: Dua): Promise<void> {
  await db.runAsync(
    `UPDATE duas SET title = ?, arabic = ?, pronunciation = ?, bengali = ?, source = ?, folder_id = ?,
     created_at = ?, updated_at = ? WHERE id = ?`,
    dua.title,
    dua.arabic,
    dua.pronunciation,
    dua.bengali,
    dua.source,
    dua.folderId,
    dua.createdAt,
    dua.updatedAt,
    dua.id,
  );
}

async function insertFolder(db: SQLiteDatabase, folder: Folder): Promise<void> {
  await db.runAsync(
    'INSERT INTO folders (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    folder.id,
    folder.name,
    folder.createdAt,
    folder.updatedAt,
  );
}

// ─── Duas ────────────────────────────────────────────────────────────────────

export async function getAll(): Promise<Dua[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DuaRow>('SELECT * FROM duas ORDER BY created_at DESC');
  return rows.map(duaFromRow);
}

/** Input must already be normalized and validated. */
export async function create(input: DuaInput): Promise<Dua> {
  const db = await getDatabase();
  const now = Date.now();
  const dua: Dua = { id: newId(), ...input, createdAt: now, updatedAt: now };
  await insertDua(db, dua);
  return dua;
}

/** Input must already be normalized and validated. */
export async function update(existing: Dua, input: DuaInput): Promise<Dua> {
  const db = await getDatabase();
  const dua: Dua = { ...existing, ...input, updatedAt: Date.now() };
  await overwriteDua(db, dua);
  return dua;
}

/** Re-inserts a previously deleted dua with its original id and timestamps (Undo). */
export async function restore(dua: Dua): Promise<void> {
  const db = await getDatabase();
  await insertDua(db, dua);
}

export async function remove(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM duas WHERE id = ?', id);
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export async function getAllFolders(): Promise<Folder[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FolderRow>('SELECT * FROM folders');
  return rows.map(folderFromRow);
}

/** Name must already be trimmed and validated. */
export async function createFolder(name: string): Promise<Folder> {
  const db = await getDatabase();
  const now = Date.now();
  const folder: Folder = { id: newId(), name, createdAt: now, updatedAt: now };
  await insertFolder(db, folder);
  return folder;
}

/** Name must already be trimmed and validated. */
export async function renameFolder(folder: Folder, name: string): Promise<Folder> {
  const db = await getDatabase();
  const renamed: Folder = { ...folder, name, updatedAt: Date.now() };
  await db.runAsync('UPDATE folders SET name = ?, updated_at = ? WHERE id = ?', name, renamed.updatedAt, folder.id);
  return renamed;
}

/** Deletes a folder. Its duas are kept and simply leave the folder. */
export async function deleteFolder(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('UPDATE duas SET folder_id = NULL WHERE folder_id = ?', id);
    await txn.runAsync('DELETE FROM folders WHERE id = ?', id);
  });
}

// ─── Import ──────────────────────────────────────────────────────────────────

/** Applies an import atomically: either everything is written or nothing is. */
export async function applyImport(plan: ImportPlan, mode: ImportMode): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    if (mode === 'replace') {
      await txn.runAsync('DELETE FROM duas');
      await txn.runAsync('DELETE FROM folders');
      for (const folder of plan.replace.folders) await insertFolder(txn, folder);
      for (const dua of plan.replace.duas) await insertDua(txn, dua);
      return;
    }
    for (const folder of plan.merge.newFolders) await insertFolder(txn, folder);
    for (const dua of plan.merge.toInsert) await insertDua(txn, dua);
    for (const dua of plan.merge.toUpdate) await overwriteDua(txn, dua);
  });
}
