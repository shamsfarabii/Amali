import { useState } from 'react';
import { Alert } from 'react-native';
import { useDuas } from '@/state/DuaProvider';
import { useToast } from '@/state/ToastProvider';
import { validateFolderName, type Folder } from '@/types/folder';
import { FolderNameDialog } from './FolderNameDialog';

type DialogState = { mode: 'create'; onCreated?: (folder: Folder) => void } | { mode: 'rename'; folder: Folder } | null;

/**
 * Create, rename and delete folders with their dialogs and confirmations.
 * Render the returned `dialog` somewhere in the screen.
 */
export function useFolderEditor() {
  const { duas, folders, createFolder, renameFolder, deleteFolder } = useDuas();
  const { showToast } = useToast();
  const [state, setState] = useState<DialogState>(null);

  const close = () => setState(null);

  const submit = async (rawName: string): Promise<string | null> => {
    if (!state) return null;
    const name = rawName.trim();
    const ignoreId = state.mode === 'rename' ? state.folder.id : undefined;
    const error = validateFolderName(name, folders, ignoreId);
    if (error) return error;

    if (state.mode === 'create') {
      const folder = await createFolder(name);
      state.onCreated?.(folder);
      showToast({ message: `Folder “${name}” created` });
    } else if (name !== state.folder.name) {
      await renameFolder(state.folder, name);
      showToast({ message: 'Folder renamed' });
    }
    close();
    return null;
  };

  const confirmDelete = (folder: Folder) => {
    const count = duas.filter((d) => d.folderId === folder.id).length;
    const message =
      count === 0
        ? 'This folder is empty.'
        : `The ${count} ${count === 1 ? 'dua' : 'duas'} in it won't be deleted. You'll still find them under All.`;
    Alert.alert(`Delete “${folder.name}”?`, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete folder',
        style: 'destructive',
        onPress: () => {
          deleteFolder(folder.id)
            .then(() => showToast({ message: 'Folder deleted' }))
            .catch(() => showToast({ message: 'The folder couldn’t be deleted. Try again.' }));
        },
      },
    ]);
  };

  /** Rename / Delete choice, e.g. on long-press. */
  const showOptions = (folder: Folder) => {
    Alert.alert(folder.name, undefined, [
      { text: 'Rename', onPress: () => setState({ mode: 'rename', folder }) },
      { text: 'Delete folder', style: 'destructive', onPress: () => confirmDelete(folder) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const dialog = (
    <FolderNameDialog
      visible={state !== null}
      title={state?.mode === 'rename' ? 'Rename folder' : 'New folder'}
      confirmLabel={state?.mode === 'rename' ? 'Save' : 'Create'}
      initialName={state?.mode === 'rename' ? state.folder.name : ''}
      onSubmit={submit}
      onClose={close}
    />
  );

  return {
    openCreate: (onCreated?: (folder: Folder) => void) => setState({ mode: 'create', onCreated }),
    openRename: (folder: Folder) => setState({ mode: 'rename', folder }),
    confirmDelete,
    showOptions,
    dialog,
  };
}
