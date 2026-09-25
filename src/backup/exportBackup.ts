import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Collection } from './planImport';
import { backupFileName, buildBackup } from './format';

const SAFETY_COPY_NAME = 'pre-import-backup.json';

function writeJson(file: File, { duas, folders }: Collection, now: Date): void {
  file.create({ overwrite: true, intermediates: true });
  file.write(JSON.stringify(buildBackup(duas, folders, now), null, 2));
}

/** Writes a backup to the cache directory and opens the system share sheet. */
export async function exportBackup(collection: Collection): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  const now = new Date();
  const file = new File(Paths.cache, backupFileName(now));
  writeJson(file, collection, now);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save Dua backup',
  });
}

/** Keeps one local copy of the collection before a destructive import. */
export function writeSafetyCopy(collection: Collection): void {
  writeJson(new File(Paths.document, SAFETY_COPY_NAME), collection, new Date());
}
