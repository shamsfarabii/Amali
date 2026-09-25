import { useState } from 'react';
import { Alert } from 'react-native';
import { useDuas } from '@/state/DuaProvider';
import { useToast } from '@/state/ToastProvider';
import { exportBackup, writeSafetyCopy } from './exportBackup';
import { pickAndPrepareImport, type PreparedImport } from './importBackup';
import type { ImportMode, ImportPlan } from './planImport';

type Busy = 'export' | 'import' | null;

const plural = (n: number, word = 'dua') => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Export and import flows with their confirmations, shared by Settings and the empty Home screen. */
export function useBackupActions() {
  const { duas, folders, applyImport } = useDuas();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<Busy>(null);

  const exportAll = async () => {
    setBusy('export');
    try {
      await exportBackup({ duas, folders });
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusy(null);
    }
  };

  const runImport = async (plan: ImportPlan, mode: ImportMode) => {
    setBusy('import');
    try {
      if (mode === 'replace' && duas.length > 0) writeSafetyCopy({ duas, folders });
      await applyImport(plan, mode);
      const count = mode === 'replace' ? plan.replace.duas.length : plan.merge.toInsert.length + plan.merge.toUpdate.length;
      showToast({ message: `Imported ${plural(count)}` });
    } catch {
      Alert.alert('Import failed', 'Nothing was changed. Your collection is exactly as it was.');
    } finally {
      setBusy(null);
    }
  };

  const confirmReplace = (plan: ImportPlan) => {
    Alert.alert(
      'Replace your whole collection?',
      `Your ${plural(duas.length)} and ${plural(folders.length, 'folder')} will be replaced by what's in this backup. ` +
        'A copy of your current collection is kept on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: () => runImport(plan, 'replace') },
      ],
    );
  };

  const importFromFile = async () => {
    setBusy('import');
    let prepared: PreparedImport;
    try {
      prepared = await pickAndPrepareImport({ duas, folders });
    } catch {
      prepared = { status: 'error', message: 'The file could not be read. Choose a backup file exported from this app.' };
    } finally {
      setBusy(null);
    }

    if (prepared.status === 'canceled') return;
    if (prepared.status === 'error') {
      Alert.alert('Can’t import this file', prepared.message);
      return;
    }

    const { plan, invalidCount } = prepared;
    const { merge } = plan;
    const details = [
      `${merge.toInsert.length} new`,
      merge.toUpdate.length > 0 ? `${merge.toUpdate.length} updated` : null,
      merge.newFolders.length > 0 ? `${plural(merge.newFolders.length, 'new folder')}` : null,
      merge.duplicateCount > 0 ? `${merge.duplicateCount} already in your collection` : null,
      invalidCount > 0 ? `${invalidCount} unreadable, will be skipped` : null,
    ]
      .filter(Boolean)
      .join('\n');
    const summary = `This backup has ${plural(plan.replace.duas.length)}.\n\n${details}`;

    if (duas.length === 0) {
      Alert.alert('Restore backup?', summary, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => runImport(plan, 'merge') },
      ]);
      return;
    }

    const nothingNew = merge.toInsert.length === 0 && merge.toUpdate.length === 0;
    Alert.alert(
      nothingNew ? 'Nothing new to add' : 'Add these duas?',
      nothingNew ? `${summary}\n\nYou can still replace your collection with this backup.` : summary,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace all', style: 'destructive', onPress: () => confirmReplace(plan) },
        ...(nothingNew ? [] : [{ text: 'Add new', onPress: () => runImport(plan, 'merge') }]),
      ],
    );
  };

  return { busy, exportAll, importFromFile };
}
