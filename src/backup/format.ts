import type { Dua } from '@/types/dua';
import type { Folder } from '@/types/folder';

export const BACKUP_FORMAT = 'custom-dua-backup';
/**
 * History:
 * 1: duas with arabic, bengali, source
 * 2: adds title, pronunciation, folderId on duas, and a top-level folders list
 */
export const BACKUP_VERSION = 2;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  /** ISO 8601 timestamp. */
  exportedAt: string;
  count: number;
  folders: Folder[];
  duas: Dua[];
}

export function buildBackup(duas: Dua[], folders: Folder[], now: Date): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    count: duas.length,
    folders: folders.map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt })),
    duas: duas.map(({ id, title, arabic, pronunciation, bengali, source, folderId, createdAt, updatedAt }) => ({
      id,
      title,
      arabic,
      pronunciation,
      bengali,
      source,
      folderId,
      createdAt,
      updatedAt,
    })),
  };
}

export function backupFileName(now: Date): string {
  return `dua-backup-${now.toISOString().slice(0, 10)}.json`;
}
