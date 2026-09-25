import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  onPress: () => void;
  /** Filled pill for the confirming action (e.g. Save). Otherwise an icon button. */
  primary?: boolean;
  /** Shown on the icon (non-primary) button; `label` is read by screen readers. */
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Header actions for the form, in the Material full-screen dialog style: a close icon on the left
 * and a filled Save pill on the right. iOS uses native bar button items instead (see the form screen).
 */
export function HeaderButton({ label, onPress, primary = false, icon = 'close', disabled = false, loading = false }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const inactive = disabled || loading;

  if (!primary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive }}
        android_ripple={{ color: colors.surfacePressed, borderless: true, radius: 22 }}
        style={({ pressed }) => [styles.icon, pressed && styles.pressed, inactive && styles.disabled]}
      >
        <Icon name={icon} size={24} color={colors.text} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      android_ripple={{ color: colors.onAccent, foreground: true }}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed, disabled && !loading && styles.disabled]}
    >
      <View style={styles.pillContent}>
        {/* The label stays in place under the spinner so the pill doesn't change width. */}
        <Text style={[styles.pillLabel, loading && styles.hidden]}>{label}</Text>
        {loading ? <ActivityIndicator size="small" color={colors.onAccent} style={StyleSheet.absoluteFill} /> : null}
      </View>
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    icon: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pill: {
      height: 36,
      minWidth: 76,
      paddingHorizontal: spacing.md + 2,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: colors.accent,
    },
    pillContent: {
      justifyContent: 'center',
    },
    pillLabel: {
      fontFamily: fonts.semibold,
      fontSize: type.body,
      // Hind Siliguri sits high in its line box; a fixed line height centers it in the pill.
      lineHeight: 20,
      includeFontPadding: false,
      color: colors.onAccent,
    },
    hidden: {
      opacity: 0,
    },
    pressed: {
      opacity: 0.8,
    },
    disabled: {
      opacity: 0.4,
    },
  });
