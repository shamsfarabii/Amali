import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { newId } from '@/utils/id';
import { MAX_BACKUP_BYTES } from './format';
import { planImport, type Collection, type ImportPlan } from './planImport';
import { parseBackupText, validateBackup, VALIDATION_MESSAGES } from './validate';

export type PreparedImport =
  | { status: 'canceled' }
  | { status: 'error'; message: string }
  | { status: 'ready'; plan: ImportPlan; invalidCount: number };

/** Lets the user pick a backup file, then reads, validates and plans it. Never writes. */
export async function pickAndPrepareImport(existing: Collection): Promise<PreparedImport> {
  const result = await DocumentPicker.getDocumentAsync({
    // Some Android file providers label JSON files as generic binaries.
    type: ['application/json', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) return { status: 'canceled' };

  const file = new File(result.assets[0].uri);
  const size = result.assets[0].size ?? file.size;
  if (size > MAX_BACKUP_BYTES) {
    return { status: 'error', message: 'This file is too large to be a Dua backup.' };
  }

  let raw: unknown;
  try {
    raw = parseBackupText(await file.text());
  } catch {
    return { status: 'error', message: VALIDATION_MESSAGES.parse };
  }

  const validation = validateBackup(raw, Date.now(), newId);
  if (!validation.ok) return { status: 'error', message: VALIDATION_MESSAGES[validation.error] };

  return {
    status: 'ready',
    plan: planImport(existing, { duas: validation.duas, folders: validation.folders }),
    invalidCount: validation.invalidCount,
  };
}
