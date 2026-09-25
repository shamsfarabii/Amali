import { LIMITS, type Dua } from '@/types/dua';
import { FOLDER_NAME_MAX, type Folder } from '@/types/folder';
import { BACKUP_FORMAT, BACKUP_VERSION } from './format';

export type ValidationError = 'parse' | 'format' | 'version' | 'empty' | 'no_valid';

export type ValidationResult =
  | { ok: false; error: ValidationError }
  | { ok: true; duas: Dua[]; folders: Folder[]; invalidCount: number };

export const VALIDATION_MESSAGES: Record<ValidationError, string> = {
  parse: 'This file is not a valid backup (it could not be read as JSON).',
  format: 'This file is not a Dua backup.',
  version: 'This backup was made by a newer version of the app. Update the app, then import again.',
  empty: 'This backup contains no duas.',
  no_valid: 'No valid duas were found in this backup.',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Anything before 2000-01-01 or far in the future is treated as corrupted.
const MIN_TIMESTAMP = 946684800000;
const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, max: number, required: boolean): string | null {
  if (value === undefined || value === null) return required ? null : '';
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (required && text === '') return null;
  if (text.length > max) return null;
  return text;
}

function readTimestamp(value: unknown, now: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < MIN_TIMESTAMP || value > now + MAX_FUTURE_MS) return null;
  return value;
}

function readId(value: unknown): string | null {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value.toLowerCase() : null;
}

function readTimestamps(raw: Record<string, unknown>, now: number) {
  const createdAt = readTimestamp(raw.createdAt, now) ?? now;
  const updatedAt = Math.max(readTimestamp(raw.updatedAt, now) ?? createdAt, createdAt);
  return { createdAt, updatedAt };
}

/** Validates one folder entry. Returns null when unusable; a bad id is repaired. */
export function validateFolder(raw: unknown, now: number, newId: () => string): Folder | null {
  if (!isRecord(raw)) return null;
  const name = readText(raw.name, FOLDER_NAME_MAX, true);
  if (name === null) return null;
  return { id: readId(raw.id) ?? newId(), name, ...readTimestamps(raw, now) };
}

/**
 * Validates one dua entry. Returns null when the entry is unusable.
 * Missing or bad ids/timestamps are repaired; unknown fields are dropped.
 * Title is optional here so that older backups (made before titles existed) still import.
 */
export function validateDua(raw: unknown, now: number, newId: () => string): Dua | null {
  if (!isRecord(raw)) return null;

  const title = readText(raw.title, LIMITS.title, false);
  const arabic = readText(raw.arabic, LIMITS.arabic, true);
  const pronunciation = readText(raw.pronunciation, LIMITS.pronunciation, false);
  const bengali = readText(raw.bengali, LIMITS.bengali, true);
  const source = readText(raw.source, LIMITS.source, false);
  if (title === null || arabic === null || pronunciation === null || bengali === null || source === null) {
    return null;
  }

  return {
    id: readId(raw.id) ?? newId(),
    title,
    arabic,
    pronunciation,
    bengali,
    source,
    // Checked against the backup's folders in validateBackup.
    folderId: readId(raw.folderId),
    ...readTimestamps(raw, now),
  };
}

/** Parses file contents. Strips a UTF-8 BOM, which some editors add. */
export function parseBackupText(text: string): unknown {
  return JSON.parse(text.replace(/^﻿/, ''));
}

/** Validates a parsed backup. Pure: `now` and `newId` are injected for testability. */
export function validateBackup(raw: unknown, now: number, newId: () => string): ValidationResult {
  if (!isRecord(raw) || raw.format !== BACKUP_FORMAT || !Array.isArray(raw.duas)) {
    return { ok: false, error: 'format' };
  }
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1) {
    return { ok: false, error: 'format' };
  }
  if (raw.version > BACKUP_VERSION) {
    return { ok: false, error: 'version' };
  }
  if (raw.duas.length === 0) {
    return { ok: false, error: 'empty' };
  }

  // Folders are a convenience: a broken folder list never blocks restoring the duas themselves.
  const folders: Folder[] = [];
  if (Array.isArray(raw.folders)) {
    for (const item of raw.folders) {
      const folder = validateFolder(item, now, newId);
      if (folder) folders.push(folder);
    }
  }
  const folderIds = new Set(folders.map((f) => f.id));

  const duas: Dua[] = [];
  let invalidCount = 0;
  for (const item of raw.duas) {
    const dua = validateDua(item, now, newId);
    if (!dua) {
      invalidCount++;
      continue;
    }
    // A dua pointing at a folder that isn't in the backup simply has no folder.
    if (dua.folderId && !folderIds.has(dua.folderId)) dua.folderId = null;
    duas.push(dua);
  }

  if (duas.length === 0) return { ok: false, error: 'no_valid' };
  return { ok: true, duas, folders, invalidCount };
}
