import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { useFolderEditor } from '@/components/useFolderEditor';
import { useDuas } from '@/state/DuaProvider';
import type { Folder } from '@/types/folder';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';

export default function FoldersScreen() {
  const styles = useThemedStyles(makeStyles);
  const { duas, folders } = useDuas();
  const editor = useFolderEditor();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const dua of duas) if (dua.folderId) map.set(dua.folderId, (map.get(dua.folderId) ?? 0) + 1);
    return map;
  }, [duas]);

  const header = (
    <Stack.Screen
      options={{
        headerRight: () => <IconButton icon="folderAdd" label="New folder" onPress={() => editor.openCreate()} />,
      }}
    />
  );

  if (folders.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="No folders yet"
          message="Folders keep related duas together, like morning and evening duas, or duas for travel."
        >
          <Button title="Create a folder" icon="folderAdd" onPress={() => editor.openCreate()} />
        </EmptyState>
        {editor.dialog}
      </>
    );
  }

  return (
    <>
      {header}
      <FlatList
        data={folders}
        keyExtractor={(folder) => folder.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Tap a folder to rename or delete it. Deleting a folder keeps its duas.
          </Text>
        }
        renderItem={({ item, index }) => (
          <FolderRow
            folder={item}
            count={counts.get(item.id) ?? 0}
            first={index === 0}
            last={index === folders.length - 1}
            onPress={() => editor.showOptions(item)}
          />
        )}
      />
      {editor.dialog}
    </>
  );
}

interface RowProps {
  folder: Folder;
  count: number;
  first: boolean;
  last: boolean;
  onPress: () => void;
}

function FolderRow({ folder, count, first, last, onPress }: RowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.surfacePressed }}
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}, ${count} ${count === 1 ? 'dua' : 'duas'}`}
      accessibilityHint="Rename or delete this folder"
      style={({ pressed }) => [
        styles.row,
        first && styles.rowFirst,
        last && styles.rowLast,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.iconBox}>
        <Icon name="folder" size={20} color={colors.accent} />
      </View>
      <View style={[styles.textBox, !first && styles.divider]}>
        <Text style={styles.name} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={styles.count}>{count}</Text>
        <Icon name="more" size={18} color={colors.faint} />
      </View>
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
      maxWidth: 720,
      width: '100%',
      alignSelf: 'center',
    },
    hint: {
      paddingHorizontal: spacing.xs,
      marginBottom: spacing.md,
      fontFamily: fonts.regular,
      fontSize: type.caption,
      lineHeight: type.caption * 1.5,
      color: colors.muted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingLeft: spacing.md,
      minHeight: 56,
      backgroundColor: colors.surface,
    },
    rowFirst: {
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    rowLast: {
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    rowPressed: {
      backgroundColor: colors.surfacePressed,
    },
    iconBox: {
      width: 32,
      height: 32,
      marginVertical: 12,
      marginRight: spacing.md - 2,
      borderRadius: radius.sm,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    name: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: type.bodyLarge - 1,
      color: colors.text,
    },
    count: {
      fontFamily: fonts.medium,
      fontSize: type.body,
      color: colors.faint,
      fontVariant: ['tabular-nums'],
    },
  });
