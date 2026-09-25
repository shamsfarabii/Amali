import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { DuaListItem } from '@/components/DuaListItem';
import { EmptyState } from '@/components/EmptyState';
import { FolderChips, type FolderFilter } from '@/components/FolderChips';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { SearchBar } from '@/components/SearchBar';
import { useFolderEditor } from '@/components/useFolderEditor';
import { useBackupActions } from '@/backup/useBackupActions';
import { useDuas } from '@/state/DuaProvider';
import type { Dua } from '@/types/dua';
import { matchesQuery, normalizeText } from '@/utils/normalize';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';

const ALL: FolderFilter = { kind: 'all' };

function inFilter(dua: Dua, filter: FolderFilter): boolean {
  if (filter.kind === 'all') return true;
  if (filter.kind === 'unfiled') return dua.folderId === null;
  return dua.folderId === filter.id;
}

const plural = (n: number) => `${n} ${n === 1 ? 'dua' : 'duas'}`;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { duas, folders, loading, error, getFolder, setBrowseIds } = useDuas();
  const { busy, importFromFile } = useBackupActions();
  const folderEditor = useFolderEditor();
  const [query, setQuery] = useState('');
  const [selectedFilter, setFilter] = useState<FolderFilter>(ALL);

  const counts = useMemo(() => {
    const byFolder = new Map<string, number>();
    let unfiled = 0;
    for (const dua of duas) {
      if (dua.folderId) byFolder.set(dua.folderId, (byFolder.get(dua.folderId) ?? 0) + 1);
      else unfiled++;
    }
    return { all: duas.length, unfiled, byFolder };
  }, [duas]);

  // The selected filter can disappear (folder deleted or replaced by an import, or the last
  // unfiled dua moved into a folder): fall back to All.
  const selectedFolder = selectedFilter.kind === 'folder' ? getFolder(selectedFilter.id) : undefined;
  const filterGone =
    (selectedFilter.kind === 'folder' && !selectedFolder) || (selectedFilter.kind === 'unfiled' && counts.unfiled === 0);
  const filter = filterGone ? ALL : selectedFilter;

  // One normalized search string per dua, rebuilt only when the list changes.
  const searchIndex = useMemo(
    () =>
      duas.map((dua) => ({
        dua,
        text: normalizeText([dua.title, dua.arabic, dua.pronunciation, dua.bengali, dua.source].join(' ')),
      })),
    [duas],
  );

  const inView = useMemo(() => duas.filter((dua) => inFilter(dua, filter)).length, [duas, filter]);
  const results = useMemo(
    () =>
      searchIndex
        .filter((entry) => inFilter(entry.dua, filter) && matchesQuery(entry.text, query))
        .map((entry) => entry.dua),
    [searchIndex, filter, query],
  );

  const openDua = useCallback(
    (duaId: string) => {
      setBrowseIds(results.map((d) => d.id));
      router.push({ pathname: '/dua/[id]', params: { id: duaId } });
    },
    [router, results, setBrowseIds],
  );
  // New duas go into the folder being viewed.
  const addDua = () =>
    router.push({ pathname: '/dua/form', params: selectedFolder ? { folderId: selectedFolder.id } : {} });
  const searching = query.trim() !== '';

  const header = (
    <Stack.Screen
      options={{
        headerRight: () => (
          <View style={styles.headerActions}>
            <IconButton icon="folder" label="Manage folders" onPress={() => router.push('/folders')} />
            <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
          </View>
        ),
      }}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        {header}
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <EmptyState title="Your duas couldn’t be loaded" message="Close the app completely and open it again." />
      </>
    );
  }

  if (duas.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="Start your collection"
          message="Keep the duas you recite, with their pronunciation, Bengali meaning and where they come from. Everything stays on this device."
        >
          <Button title="Add your first dua" icon="add" onPress={addDua} />
          <Button
            title="Restore from a backup"
            icon="import"
            variant="secondary"
            onPress={importFromFile}
            loading={busy === 'import'}
          />
        </EmptyState>
      </>
    );
  }

  const where = filter.kind === 'folder' ? ` in ${selectedFolder?.name}` : filter.kind === 'unfiled' ? ' without a folder' : '';
  const countLine = searching ? `${results.length} of ${plural(inView)}${where}` : `${plural(inView)}${where}`;

  const emptyList = searching ? (
    <EmptyState title="No matching duas" message="Try a shorter word, or search in another language." />
  ) : filter.kind === 'folder' ? (
    <EmptyState title="This folder is empty" message="Add a dua here, or move one in from its edit screen.">
      <Button title="Add a dua to this folder" icon="add" variant="secondary" onPress={addDua} />
    </EmptyState>
  ) : null;

  return (
    <View style={styles.flex}>
      {header}
      <FlatList
        data={results}
        keyExtractor={(dua) => dua.id}
        renderItem={({ item }) => <DuaListItem dua={item} onPress={openDua} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SearchBar value={query} onChangeText={setQuery} />
            <FolderChips
              folders={folders}
              filter={filter}
              counts={counts}
              onChange={setFilter}
              onCreate={() => folderEditor.openCreate((folder) => setFilter({ kind: 'folder', id: folder.id }))}
              onFolderLongPress={folderEditor.showOptions}
            />
            <Text style={styles.count} accessibilityLiveRegion="polite">
              {countLine}
            </Text>
          </View>
        }
        ListEmptyComponent={emptyList}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      />

      <Pressable
        onPress={addDua}
        accessibilityRole="button"
        accessibilityLabel={selectedFolder ? `Add dua to ${selectedFolder.name}` : 'Add dua'}
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + spacing.md }, pressed && styles.fabPressed]}
      >
        <Icon name="add" size={20} color={colors.onAccent} />
        <Text style={styles.fabLabel}>Add dua</Text>
      </Pressable>

      {folderEditor.dialog}
    </View>
  );
}

function Separator() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.separatorTrack}>
      <View style={styles.separator} />
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    listHeader: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    count: {
      paddingHorizontal: spacing.xs,
      fontFamily: fonts.medium,
      fontSize: type.caption,
      color: colors.muted,
    },
    separatorTrack: {
      backgroundColor: colors.surface,
    },
    separator: {
      marginLeft: spacing.md + 4,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    fab: {
      position: 'absolute',
      right: spacing.md + 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 52,
      paddingHorizontal: spacing.lg - 2,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    fabPressed: {
      opacity: 0.85,
    },
    fabLabel: {
      fontFamily: fonts.semibold,
      fontSize: type.bodyLarge,
      color: colors.onAccent,
    },
  });
