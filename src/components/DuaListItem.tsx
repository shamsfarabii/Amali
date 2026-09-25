import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { Dua } from '@/types/dua';
import { spacing, useTheme, useThemedStyles, type Theme } from '@/theme';
import { DuaText } from './DuaText';

interface Props {
  dua: Dua;
  onPress: (id: string) => void;
}

/** Title on top, then the opening of the Arabic on one line. */
export const DuaListItem = memo(function DuaListItem({ dua, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const untitled = !dua.title;

  return (
    <Pressable
      onPress={() => onPress(dua.id)}
      android_ripple={{ color: colors.surfacePressed }}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={untitled ? 'Untitled dua' : dua.title}
      accessibilityHint="Opens this dua"
    >
      <DuaText variant="title" baseSize={17} numberOfLines={2} style={untitled && styles.untitled}>
        {untitled ? 'Untitled dua' : dua.title}
      </DuaText>
      <DuaText variant="arabic" baseSize={22} numberOfLines={1} style={styles.arabic}>
        {dua.arabic}
      </DuaText>
    </Pressable>
  );
});

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    item: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md + 4,
      paddingTop: spacing.md - 2,
      paddingBottom: spacing.sm,
    },
    pressed: {
      backgroundColor: colors.surfacePressed,
    },
    untitled: {
      color: colors.faint,
    },
    arabic: {
      color: colors.muted,
    },
  });
