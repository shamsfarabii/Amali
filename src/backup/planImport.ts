import type { Dua } from '@/types/dua';
import { folderNameKey, type Folder } from '@/types/folder';
import { normalizeText } from '@/utils/normalize';

export type ImportMode = 'merge' | 'replace';

export interface Collection {
  duas: Dua[];
  folders: Folder[];
}

export interface ImportPlan {
  merge: {
    /** Folders from the backup that don't exist here yet (by id or by name). */
    newFolders: Folder[];
    /** New duas to insert. */
    toInsert: Dua[];
    /** Existing duas whose incoming copy is newer. */
    toUpdate: Dua[];
    /** Entries skipped because they already exist or repeat within the file. */
    duplicateCount: number;
  };
  replace: {
    /** Every unique folder from the backup. */
    folders: Folder[];
    /** Every unique dua from the backup. */
    duas: Dua[];
  };
}

/** Identifies the same dua typed twice, ignoring diacritics, case and spacing. */
export function contentKey(dua: Pick<Dua, 'arabic' | 'bengali' | 'source'>): string {
  return [dua.arabic, dua.bengali, dua.source].map(normalizeText).join('\u0000');
}

/** Everything a user can edit; used to tell whether an update actually changes anything. */
function fullKey(dua: Dua): string {
  return [dua.title, dua.arabic, dua.pronunciation, dua.bengali, dua.source, dua.folderId ?? ''].join('\u0000');
}

/** Keeps the first folder per id and per name. Returns the kept folders and a map for the dropped ones. */
function dedupeFolders(folders: Folder[]): { unique: Folder[]; idMap: Map<string, string> } {
  const byName = new Map<string, Folder>();
  const idMap = new Map<string, string>();
  const unique: Folder[] = [];
  for (const folder of folders) {
    if (idMap.has(folder.id)) continue;
    const existing = byName.get(folderNameKey(folder.name));
    if (existing) {
      idMap.set(folder.id, existing.id);
      continue;
    }
    byName.set(folderNameKey(folder.name), folder);
    idMap.set(folder.id, folder.id);
    unique.push(folder);
  }
  return { unique, idMap };
}

/** Within the file, the same id or the same content keeps only the newest entry. */
function dedupeDuas(duas: Dua[]): { unique: Dua[]; duplicateCount: number } {
  const sorted = [...duas].sort((a, b) => b.updatedAt - a.updatedAt);
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const unique: Dua[] = [];
  let duplicateCount = 0;
  for (const dua of sorted) {
    const key = contentKey(dua);
    if (seenIds.has(dua.id) || seenContent.has(key)) {
      duplicateCount++;
      continue;
    }
    seenIds.add(dua.id);
    seenContent.add(key);
    unique.push(dua);
  }
  return { unique, duplicateCount };
}

function remapFolder(dua: Dua, idMap: Map<string, string>): Dua {
  const folderId = dua.folderId ? (idMap.get(dua.folderId) ?? null) : null;
  return folderId === dua.folderId ? dua : { ...dua, folderId };
}

/**
 * Decides what an import will do, without touching storage.
 *
 * Folders (merge): an incoming folder with a known id, or the same name as an existing
 * folder, maps onto that folder. Otherwise it is created.
 *
 * Duas (merge):
 * 1. Within the file, the same id or the same content keeps only the newest entry.
 * 2. Same id as an existing dua → update if incoming is newer and different, otherwise skip.
 * 3. New id but same content as an existing dua → skip.
 * 4. Everything else → insert.
 */
export function planImport(existing: Collection, incoming: Collection): ImportPlan {
  const { unique: fileFolders, idMap: fileFolderMap } = dedupeFolders(incoming.folders);
  const fileDuas = incoming.duas.map((d) => remapFolder(d, fileFolderMap));
  const { unique: uniqueDuas, duplicateCount: fileDuplicates } = dedupeDuas(fileDuas);

  // ── Merge: map incoming folders onto existing ones where possible.
  const existingFolderIds = new Set(existing.folders.map((f) => f.id));
  const existingByName = new Map(existing.folders.map((f) => [folderNameKey(f.name), f.id]));
  const mergeFolderMap = new Map<string, string>();
  const newFolders: Folder[] = [];
  for (const folder of fileFolders) {
    if (existingFolderIds.has(folder.id)) {
      mergeFolderMap.set(folder.id, folder.id);
      continue;
    }
    const sameName = existingByName.get(folderNameKey(folder.name));
    if (sameName) {
      mergeFolderMap.set(folder.id, sameName);
      continue;
    }
    mergeFolderMap.set(folder.id, folder.id);
    newFolders.push(folder);
  }

  const existingById = new Map(existing.duas.map((d) => [d.id, d]));
  const existingContent = new Set(existing.duas.map(contentKey));
  const toInsert: Dua[] = [];
  const toUpdate: Dua[] = [];
  let duplicateCount = fileDuplicates;

  for (const raw of uniqueDuas) {
    const dua = remapFolder(raw, mergeFolderMap);
    const current = existingById.get(dua.id);
    if (current) {
      // Rule 2
      if (dua.updatedAt > current.updatedAt && fullKey(current) !== fullKey(dua)) toUpdate.push(dua);
      else duplicateCount++;
    } else if (existingContent.has(contentKey(dua))) {
      // Rule 3
      duplicateCount++;
    } else {
      // Rule 4
      toInsert.push(dua);
    }
  }

  return {
    merge: { newFolders, toInsert, toUpdate, duplicateCount },
    replace: { folders: fileFolders, duas: uniqueDuas },
  };
}
