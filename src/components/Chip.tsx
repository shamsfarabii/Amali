import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  selected?: boolean;
  /** Small number shown after the label, e.g. how many duas a folder holds. */
  count?: number;
  icon?: IconName;
  onPress: () => void;
  onLongPress?: () => void;
}

export function Chip({ label, selected = false, count, icon, onPress, onLongPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const color = selected ? colors.onAccent : colors.text;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? colors.onAccent : colors.accent} /> : null}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text style={[styles.count, { color: selected ? colors.onAccent : colors.faint }]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 36,
      maxWidth: 220,
      paddingHorizontal: spacing.md - 2,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    selected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    pressed: {
      opacity: 0.7,
    },
    label: {
      flexShrink: 1,
      fontFamily: fonts.medium,
      fontSize: type.body - 1,
    },
    count: {
      fontFamily: fonts.medium,
      fontSize: type.caption,
      fontVariant: ['tabular-nums'],
    },
  });
