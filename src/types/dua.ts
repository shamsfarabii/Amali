export interface Dua {
  id: string;
  /** Empty only for duas created before titles existed. New and edited duas always have one. */
  title: string;
  arabic: string;
  /** How to pronounce the Arabic (usually written in Bengali script). Empty when not given. */
  pronunciation: string;
  bengali: string;
  /** Empty string when no source is given. */
  source: string;
  /** The folder this dua is in, or null when it isn't in any folder. */
  folderId: string | null;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Epoch milliseconds. */
  updatedAt: number;
}

/** The user-editable part of a Dua. IDs and timestamps are owned by the repository. */
export type DuaInput = Pick<Dua, 'title' | 'arabic' | 'pronunciation' | 'bengali' | 'source' | 'folderId'>;

export const LIMITS = {
  title: 120,
  arabic: 5000,
  pronunciation: 5000,
  bengali: 5000,
  source: 300,
} as const;

type TextField = Exclude<keyof DuaInput, 'folderId'>;

export type DuaInputErrors = Partial<Record<TextField, string>>;

/** Trims fields so that stored data is always clean. */
export function normalizeInput(input: DuaInput): DuaInput {
  return {
    title: input.title.trim(),
    arabic: input.arabic.trim(),
    pronunciation: input.pronunciation.trim(),
    bengali: input.bengali.trim(),
    source: input.source.trim(),
    folderId: input.folderId,
  };
}

/** Returns an empty object when the (already normalized) input is valid. */
export function validateInput(input: DuaInput): DuaInputErrors {
  const errors: DuaInputErrors = {};
  const required: Partial<Record<TextField, string>> = {
    title: 'Give this dua a title',
    arabic: 'Arabic text is required',
    bengali: 'Bengali meaning is required',
  };
  for (const field of Object.keys(LIMITS) as TextField[]) {
    const value = input[field];
    if (!value && required[field]) errors[field] = required[field];
    else if (value.length > LIMITS[field]) errors[field] = `Keep this under ${LIMITS[field]} characters`;
  }
  return errors;
}
