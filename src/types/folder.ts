import { normalizeText } from '@/utils/normalize';

export interface Folder {
  id: string;
  name: string;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Epoch milliseconds. */
  updatedAt: number;
}

export const FOLDER_NAME_MAX = 50;

/** Folder names are compared ignoring case, spacing and Arabic diacritics. */
export function folderNameKey(name: string): string {
  return normalizeText(name);
}

/**
 * Returns an error message for a folder name, or null when it's usable.
 * `ignoreId` lets a folder keep its own name when renaming.
 */
export function validateFolderName(name: string, folders: Folder[], ignoreId?: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a folder name';
  if (trimmed.length > FOLDER_NAME_MAX) return `Keep the name under ${FOLDER_NAME_MAX} characters`;
  const key = folderNameKey(trimmed);
  if (folders.some((f) => f.id !== ignoreId && folderNameKey(f.name) === key)) {
    return 'A folder with this name already exists';
  }
  return null;
}

export function sortFolders(folders: Folder[]): Folder[] {
  return [...folders].sort((a, b) => a.name.localeCompare(b.name));
}
