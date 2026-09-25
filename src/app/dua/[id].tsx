import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DuaText } from '@/components/DuaText';
import { EmptyState } from '@/components/EmptyState';
import { FontSizeHeaderControl } from '@/components/FontSizeControl';
import { Icon, type IconName } from '@/components/Icon';
import { OrnamentDivider } from '@/components/Ornament';
import { useDuas } from '@/state/DuaProvider';
import { useToast } from '@/state/ToastProvider';
import type { Dua } from '@/types/dua';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';

function shareText(dua: Dua): string {
  return [dua.title, dua.arabic, dua.pronunciation, dua.bengali, dua.source ? `(${dua.source})` : null]
    .filter(Boolean)
    .join('\n\n');
}

function duaSequence(browseIds: string[], allDuas: Dua[], currentId: string): string[] {
  const collectionIds = allDuas.map((d) => d.id);
  if (browseIds.length > 0 && browseIds.includes(currentId)) return browseIds;
  if (collectionIds.includes(currentId)) return collectionIds;
  return [currentId];
}

export default function DuaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: pageWidth } = useWindowDimensions();
  const styles = useThemedStyles(makeStyles);
  const { duas, browseIds, getById, getFolder, removeDua, restoreDua } = useDuas();
  const { showToast } = useToast();
  const listRef = useRef<FlatList<string>>(null);

  const sequence = useMemo(() => duaSequence(browseIds, duas, id), [browseIds, duas, id]);
  const initialIndex = Math.max(0, sequence.indexOf(id));

  const [activeId, setActiveId] = useState(id);
  useEffect(() => {
    setActiveId(id);
  }, [id]);

  useEffect(() => {
    const index = sequence.indexOf(id);
    if (index < 0) return;
    listRef.current?.scrollToIndex({ index, animated: false });
  }, [id, sequence]);

  const activeDua = getById(activeId);
  const duaMissing = !getById(id);

  const syncPageFromOffset = useCallback(
    (offsetX: number) => {
      const index = Math.round(offsetX / pageWidth);
      const nextId = sequence[index];
      if (!nextId || nextId === activeId) return;
      setActiveId(nextId);
      router.setParams({ id: nextId });
    },
    [activeId, pageWidth, router, sequence],
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncPageFromOffset(event.nativeEvent.contentOffset.x);
    },
    [syncPageFromOffset],
  );

  const deleteDua = async () => {
    if (!activeDua) return;
    router.back();
    try {
      const removed = await removeDua(activeDua.id);
      if (!removed) return;
      showToast({
        message: 'Dua deleted',
        actionLabel: 'Undo',
        onAction: () => {
          restoreDua(removed).catch(() => showToast({ message: 'The dua couldn’t be restored' }));
        },
      });
    } catch {
      showToast({ message: 'The dua couldn’t be deleted. Try again.' });
    }
  };

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth],
  );

  const renderPage = useCallback(
    ({ item: duaId }: { item: string }) => {
      const dua = getById(duaId);
      const folder = getFolder(dua?.folderId ?? null);
      if (!dua) {
        return <View style={{ width: pageWidth }} />;
      }
      return (
        <ScrollView
          style={{ width: pageWidth }}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          directionalLockEnabled
          nestedScrollEnabled
        >
          <DuaText variant="title" selectable accessibilityRole="header" style={!dua.title && styles.untitled}>
            {dua.title || 'Untitled dua'}
          </DuaText>

          <DuaText variant="arabic" selectable style={styles.arabic}>
            {dua.arabic}
          </DuaText>

          <View style={styles.divider}>
            <OrnamentDivider />
          </View>

          {dua.pronunciation ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Pronunciation</Text>
              <DuaText variant="pronunciation" selectable>
                {dua.pronunciation}
              </DuaText>
            </View>
          ) : null}

          <View style={styles.section}>
            {dua.pronunciation ? <Text style={styles.sectionLabel}>Meaning</Text> : null}
            <DuaText variant="bengali" selectable>
              {dua.bengali}
            </DuaText>
          </View>

          {dua.source || folder ? (
            <View style={styles.tags}>
              {dua.source ? (
                <View style={styles.tag}>
                  <TagIcon name="source" />
                  <DuaText variant="source" selectable style={styles.tagText}>
                    {dua.source}
                  </DuaText>
                </View>
              ) : null}
              {folder ? (
                <View style={styles.tag} accessibilityLabel={`In folder ${folder.name}`}>
                  <TagIcon name="folder" />
                  <Text style={styles.folderText} numberOfLines={1}>
                    {folder.name}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      );
    },
    [getById, getFolder, insets.bottom, pageWidth, styles],
  );

  if (duaMissing) {
    return <EmptyState title="This dua isn’t here anymore" message="It may have been deleted." />;
  }

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ headerRight: () => <FontSizeHeaderControl /> }} />
      <FlatList
        ref={listRef}
        data={sequence}
        keyExtractor={(duaId) => duaId}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        bounces={sequence.length > 1}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollToIndexFailed={({ index }) => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index, animated: false });
          });
        }}
        keyboardShouldPersistTaps="handled"
        style={styles.flex}
      />

      {activeDua ? (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Action icon="share" label="Share" onPress={() => Share.share({ message: shareText(activeDua) })} />
          <Action
            icon="edit"
            label="Edit"
            onPress={() => router.push({ pathname: '/dua/form', params: { id: activeDua.id } })}
          />
          <Action icon="delete" label="Delete" onPress={deleteDua} danger />
        </View>
      ) : null}
    </View>
  );
}

function TagIcon({ name }: { name: IconName }) {
  const { colors } = useTheme();
  return <Icon name={name} size={16} color={colors.muted} />;
}

interface ActionProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function Action({ icon, label, onPress, danger = false }: ActionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const color = danger ? colors.danger : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: colors.surfacePressed, borderless: true }}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <Icon name={icon} size={22} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      maxWidth: 720,
      width: '100%',
      alignSelf: 'center',
    },
    untitled: {
      color: colors.faint,
    },
    arabic: {
      marginTop: spacing.lg,
    },
    divider: {
      marginVertical: spacing.lg,
    },
    section: {
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    sectionLabel: {
      fontFamily: fonts.semibold,
      fontSize: type.caption,
      color: colors.accent,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      maxWidth: '100%',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md - 4,
      borderRadius: radius.sm,
      backgroundColor: colors.accentSoft,
    },
    tagText: {
      flexShrink: 1,
    },
    folderText: {
      flexShrink: 1,
      fontFamily: fonts.medium,
      fontSize: type.caption + 1,
      color: colors.muted,
    },
    actionBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    action: {
      minWidth: 88,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    actionPressed: {
      opacity: 0.6,
    },
    actionLabel: {
      fontFamily: fonts.medium,
      fontSize: type.caption,
    },
  });
