import { ScrollView, StyleSheet } from 'react-native';
import type { Folder } from '@/types/folder';
import { spacing } from '@/theme';
import { Chip } from './Chip';

/** What the Home list is showing. */
export type FolderFilter = { kind: 'all' } | { kind: 'folder'; id: string } | { kind: 'unfiled' };

interface Props {
  folders: Folder[];
  filter: FolderFilter;
  counts: { all: number; unfiled: number; byFolder: Map<string, number> };
  onChange: (filter: FolderFilter) => void;
  onCreate: () => void;
  onFolderLongPress: (folder: Folder) => void;
}

export function FolderChips({ folders, filter, counts, onChange, onCreate, onFolderLongPress }: Props) {
  // "No folder" only makes sense once folders exist and something is outside them.
  const showUnfiled = folders.length > 0 && counts.unfiled > 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
      style={styles.scroller}
    >
      <Chip label="All" count={counts.all} selected={filter.kind === 'all'} onPress={() => onChange({ kind: 'all' })} />
      {folders.map((folder) => (
        <Chip
          key={folder.id}
          icon="folder"
          label={folder.name}
          count={counts.byFolder.get(folder.id) ?? 0}
          selected={filter.kind === 'folder' && filter.id === folder.id}
          onPress={() => onChange({ kind: 'folder', id: folder.id })}
          onLongPress={() => onFolderLongPress(folder)}
        />
      ))}
      {showUnfiled ? (
        <Chip
          label="No folder"
          count={counts.unfiled}
          selected={filter.kind === 'unfiled'}
          onPress={() => onChange({ kind: 'unfiled' })}
        />
      ) : null}
      <Chip icon="folderAdd" label="New folder" onPress={onCreate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Bleed to the screen edges so chips scroll under the margins.
  scroller: {
    marginHorizontal: -spacing.md,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
