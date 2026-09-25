import { beforeEach, describe, expect, it } from '@jest/globals';
import { BACKUP_FORMAT, BACKUP_VERSION, buildBackup } from '@/backup/format';
import { parseBackupText, validateBackup } from '@/backup/validate';
import type { Dua } from '@/types/dua';
import type { Folder } from '@/types/folder';

const NOW = Date.UTC(2026, 8, 25);
let counter = 0;
const fakeId = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

const FOLDER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

const folder = (overrides: Partial<Folder> = {}): Folder => ({
  id: FOLDER_ID,
  name: 'সকালের দোয়া',
  createdAt: NOW - 2000,
  updatedAt: NOW - 2000,
  ...overrides,
});

const dua = (overrides: Partial<Dua> = {}): Dua => ({
  id: '11111111-1111-4111-8111-111111111111',
  title: 'জ্ঞান বৃদ্ধির দোয়া',
  arabic: 'رَبِّ زِدْنِي عِلْمًا',
  pronunciation: 'রব্বি যিদনী ইলমা',
  bengali: 'হে আমার রব, আমার জ্ঞান বৃদ্ধি করুন।',
  source: 'সূরা ত্বাহা ২০:১১৪',
  folderId: null,
  createdAt: NOW - 1000,
  updatedAt: NOW - 500,
  ...overrides,
});

const backup = (duas: unknown[], extra: Record<string, unknown> = {}) => ({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt: new Date(NOW).toISOString(),
  count: duas.length,
  folders: [],
  duas,
  ...extra,
});

beforeEach(() => {
  counter = 0;
});

describe('parseBackupText', () => {
  it('throws on corrupted JSON', () => {
    expect(() => parseBackupText('{"format": "custom-dua-backup", "duas": [')).toThrow();
    expect(() => parseBackupText('')).toThrow();
  });

  it('strips a UTF-8 BOM', () => {
    expect(parseBackupText('﻿{"a":1}')).toEqual({ a: 1 });
  });
});

describe('validateBackup', () => {
  it('round-trips an exported backup unchanged', () => {
    const folders = [folder()];
    const duas = [dua({ folderId: FOLDER_ID }), dua({ id: '22222222-2222-4222-8222-222222222222', arabic: 'سبحان الله' })];
    const json = JSON.stringify(buildBackup(duas, folders, new Date(NOW)));
    const result = validateBackup(parseBackupText(json), NOW, fakeId);
    expect(result).toEqual({ ok: true, duas, folders, invalidCount: 0 });
  });

  it('imports version 1 backups, which have no titles, pronunciation or folders', () => {
    const v1 = {
      format: BACKUP_FORMAT,
      version: 1,
      duas: [{ id: dua().id, arabic: 'دعاء', bengali: 'দোয়া', source: '', createdAt: NOW, updatedAt: NOW }],
    };
    const result = validateBackup(v1, NOW, fakeId);
    expect(result.ok && result.folders).toEqual([]);
    expect(result.ok && result.duas[0]).toMatchObject({ title: '', pronunciation: '', folderId: null });
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'hello'],
    ['wrong format', backup([dua()], { format: 'something-else' })],
    ['missing duas', { format: BACKUP_FORMAT, version: 1 }],
    ['duas not an array', backup([], { duas: {} })],
    ['missing version', backup([dua()], { version: undefined })],
    ['fractional version', backup([dua()], { version: 1.5 })],
  ])('rejects %s as format error', (_label, raw) => {
    expect(validateBackup(raw, NOW, fakeId)).toEqual({ ok: false, error: 'format' });
  });

  it('rejects backups from a newer app version', () => {
    expect(validateBackup(backup([dua()], { version: BACKUP_VERSION + 1 }), NOW, fakeId)).toEqual({
      ok: false,
      error: 'version',
    });
  });

  it('rejects an empty backup', () => {
    expect(validateBackup(backup([]), NOW, fakeId)).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects a backup where every entry is invalid', () => {
    const result = validateBackup(backup([null, 42, { arabic: '' }, { bengali: 'x' }]), NOW, fakeId);
    expect(result).toEqual({ ok: false, error: 'no_valid' });
  });

  it('keeps valid entries and counts invalid ones', () => {
    const result = validateBackup(
      backup([
        dua(),
        { ...dua(), arabic: '   ' }, // blank required field
        { ...dua(), bengali: 123 }, // wrong type
        { ...dua(), source: 'x'.repeat(301) }, // too long
        { ...dua(), title: 'x'.repeat(121) }, // title too long
        'not an object',
      ]),
      NOW,
      fakeId,
    );
    expect(result.ok && result.duas.length).toBe(1);
    expect(result.ok && result.invalidCount).toBe(5);
  });

  it('trims text, drops unknown fields and defaults optional fields', () => {
    const result = validateBackup(
      backup([{ id: dua().id, arabic: '  دعاء  ', bengali: ' দোয়া ', createdAt: NOW, updatedAt: NOW, extra: true }]),
      NOW,
      fakeId,
    );
    expect(result.ok && result.duas[0]).toEqual({
      id: dua().id,
      title: '',
      arabic: 'دعاء',
      pronunciation: '',
      bengali: 'দোয়া',
      source: '',
      folderId: null,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it('repairs missing or invalid ids and timestamps', () => {
    const result = validateBackup(
      backup([{ id: 'not-a-uuid', arabic: 'دعاء', bengali: 'দোয়া', createdAt: 'yesterday', updatedAt: -5 }]),
      NOW,
      fakeId,
    );
    expect(result.ok && result.duas[0]).toMatchObject({
      id: '00000000-0000-4000-8000-000000000001',
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it('never lets updatedAt be earlier than createdAt', () => {
    const result = validateBackup(backup([dua({ createdAt: NOW - 100, updatedAt: NOW - 200 })]), NOW, fakeId);
    expect(result.ok && result.duas[0].updatedAt).toBe(NOW - 100);
  });

  it('rejects timestamps far in the future', () => {
    const future = NOW + 10 * 24 * 60 * 60 * 1000;
    const result = validateBackup(backup([dua({ createdAt: future, updatedAt: future })]), NOW, fakeId);
    expect(result.ok && result.duas[0].createdAt).toBe(NOW);
  });

  describe('folders', () => {
    it('skips invalid folders without rejecting the backup', () => {
      const result = validateBackup(
        backup([dua()], { folders: [folder(), { name: '' }, { name: 'x'.repeat(51) }, 7] }),
        NOW,
        fakeId,
      );
      expect(result.ok && result.folders).toEqual([folder()]);
    });

    it('ignores a folders field that is not a list', () => {
      const result = validateBackup(backup([dua()], { folders: 'oops' }), NOW, fakeId);
      expect(result.ok && result.folders).toEqual([]);
    });

    it('clears a folder reference that points at a missing folder', () => {
      const result = validateBackup(
        backup([dua({ folderId: '99999999-9999-4999-8999-999999999999' })], { folders: [folder()] }),
        NOW,
        fakeId,
      );
      expect(result.ok && result.duas[0].folderId).toBeNull();
    });

    it('clears a malformed folder reference', () => {
      const result = validateBackup(backup([{ ...dua(), folderId: 42 }], { folders: [folder()] }), NOW, fakeId);
      expect(result.ok && result.duas[0].folderId).toBeNull();
    });
  });
});
