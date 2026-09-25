import { describe, expect, it } from '@jest/globals';
import { planImport } from '@/backup/planImport';
import type { Dua } from '@/types/dua';
import type { Folder } from '@/types/folder';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const fid = (n: number) => `ffffffff-0000-4000-8000-${String(n).padStart(12, '0')}`;

const dua = (n: number, overrides: Partial<Dua> = {}): Dua => ({
  id: id(n),
  title: `Title ${n}`,
  arabic: `دعاء ${n}`,
  pronunciation: '',
  bengali: `দোয়া ${n}`,
  source: '',
  folderId: null,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

const folder = (n: number, name: string): Folder => ({ id: fid(n), name, createdAt: 1000, updatedAt: 1000 });

const empty = { duas: [], folders: [] };

describe('planImport: duas', () => {
  it('inserts everything into an empty collection', () => {
    const plan = planImport(empty, { duas: [dua(1), dua(2)], folders: [] });
    expect(plan.merge.toInsert.map((d) => d.id)).toEqual(expect.arrayContaining([id(1), id(2)]));
    expect(plan.merge.toUpdate).toEqual([]);
    expect(plan.merge.duplicateCount).toBe(0);
    expect(plan.replace.duas).toHaveLength(2);
  });

  it('skips an exact re-import of the same collection', () => {
    const collection = { duas: [dua(1), dua(2)], folders: [] };
    const plan = planImport(collection, collection);
    expect(plan.merge.toInsert).toEqual([]);
    expect(plan.merge.toUpdate).toEqual([]);
    expect(plan.merge.duplicateCount).toBe(2);
  });

  it('updates an existing dua when the incoming copy is newer and different', () => {
    const newer = dua(1, { title: 'Renamed', updatedAt: 2000 });
    const plan = planImport({ duas: [dua(1)], folders: [] }, { duas: [newer], folders: [] });
    expect(plan.merge.toUpdate).toEqual([newer]);
    expect(plan.merge.toInsert).toEqual([]);
  });

  it('keeps the local copy when the incoming one is older', () => {
    const local = dua(1, { bengali: 'স্থানীয়', updatedAt: 3000 });
    const plan = planImport({ duas: [local], folders: [] }, { duas: [dua(1, { updatedAt: 2000 })], folders: [] });
    expect(plan.merge.toUpdate).toEqual([]);
    expect(plan.merge.duplicateCount).toBe(1);
  });

  it('skips a new id whose content already exists (ignoring diacritics and spacing)', () => {
    const local = dua(1, { arabic: 'رَبِّ زِدْنِي عِلْمًا' });
    const incoming = dua(99, { arabic: 'رب  زدني علما', bengali: local.bengali, title: 'Other title' });
    const plan = planImport({ duas: [local], folders: [] }, { duas: [incoming], folders: [] });
    expect(plan.merge.toInsert).toEqual([]);
    expect(plan.merge.duplicateCount).toBe(1);
  });

  it('dedupes repeated ids inside the file, keeping the newest', () => {
    const older = dua(1, { bengali: 'পুরনো', updatedAt: 1000 });
    const newer = dua(1, { bengali: 'নতুন', updatedAt: 2000 });
    const plan = planImport(empty, { duas: [older, newer], folders: [] });
    expect(plan.merge.toInsert).toEqual([newer]);
    expect(plan.replace.duas).toEqual([newer]);
    expect(plan.merge.duplicateCount).toBe(1);
  });

  it('dedupes repeated content inside the file', () => {
    const plan = planImport(empty, { duas: [dua(1), dua(2, { arabic: 'دعاء 1', bengali: 'দোয়া 1' })], folders: [] });
    expect(plan.merge.toInsert).toHaveLength(1);
    expect(plan.merge.duplicateCount).toBe(1);
  });

  it('does not mutate its inputs', () => {
    const existing = { duas: [dua(1)], folders: [folder(1, 'Morning')] };
    const incoming = { duas: [dua(3, { folderId: fid(2) }), dua(2)], folders: [folder(2, 'morning')] };
    const snapshot = JSON.stringify({ existing, incoming });
    planImport(existing, incoming);
    expect(JSON.stringify({ existing, incoming })).toBe(snapshot);
  });
});

describe('planImport: folders', () => {
  it('creates folders that do not exist yet', () => {
    const plan = planImport(empty, { duas: [dua(1, { folderId: fid(1) })], folders: [folder(1, 'Morning')] });
    expect(plan.merge.newFolders).toEqual([folder(1, 'Morning')]);
    expect(plan.merge.toInsert[0].folderId).toBe(fid(1));
  });

  it('reuses an existing folder with the same id', () => {
    const existing = { duas: [], folders: [folder(1, 'Morning')] };
    const plan = planImport(existing, { duas: [dua(1, { folderId: fid(1) })], folders: [folder(1, 'Morning')] });
    expect(plan.merge.newFolders).toEqual([]);
    expect(plan.merge.toInsert[0].folderId).toBe(fid(1));
  });

  it('maps a folder onto an existing one with the same name (ignoring case)', () => {
    const existing = { duas: [], folders: [folder(1, 'Morning')] };
    const plan = planImport(existing, { duas: [dua(1, { folderId: fid(2) })], folders: [folder(2, '  morning ')] });
    expect(plan.merge.newFolders).toEqual([]);
    expect(plan.merge.toInsert[0].folderId).toBe(fid(1));
  });

  it('merges folders with the same name inside the file', () => {
    const plan = planImport(empty, {
      duas: [dua(1, { folderId: fid(1) }), dua(2, { folderId: fid(2) })],
      folders: [folder(1, 'Morning'), folder(2, 'MORNING')],
    });
    expect(plan.merge.newFolders).toHaveLength(1);
    expect(plan.replace.folders).toHaveLength(1);
    expect(plan.merge.toInsert.every((d) => d.folderId === fid(1))).toBe(true);
    expect(plan.replace.duas.every((d) => d.folderId === fid(1))).toBe(true);
  });

  it('counts a folder move as an update', () => {
    const existing = { duas: [dua(1)], folders: [folder(1, 'Morning')] };
    const moved = dua(1, { folderId: fid(1), updatedAt: 2000 });
    const plan = planImport(existing, { duas: [moved], folders: [folder(1, 'Morning')] });
    expect(plan.merge.toUpdate).toEqual([moved]);
  });
});
