import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon, type IconName } from './Icon';

/** A titled group of rows. */
export function SettingsSection({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.group}>{children}</View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

interface RowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Draws a hairline above the row (for all rows except the first in a group). */
  divider?: boolean;
}

export function SettingsRow({ icon, title, subtitle, onPress, disabled = false, loading = false, divider }: RowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      android_ripple={{ color: colors.surfacePressed }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && styles.rowDisabled]}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={20} color={colors.accent} />
      </View>
      <View style={[styles.textBox, divider && styles.divider]}>
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Icon name="chevron" size={16} color={colors.faint} />
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      paddingHorizontal: spacing.xs,
      fontFamily: fonts.semibold,
      fontSize: type.body,
      color: colors.muted,
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    footer: {
      paddingHorizontal: spacing.xs,
      fontFamily: fonts.regular,
      fontSize: type.caption,
      lineHeight: type.caption * 1.5,
      color: colors.faint,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingLeft: spacing.md,
      minHeight: 60,
    },
    rowPressed: {
      backgroundColor: colors.surfacePressed,
    },
    rowDisabled: {
      opacity: 0.45,
    },
    iconBox: {
      width: 32,
      height: 32,
      marginVertical: 14,
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
      paddingRight: spacing.md,
      paddingVertical: spacing.sm + 2,
      gap: spacing.sm,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    texts: {
      flex: 1,
    },
    title: {
      fontFamily: fonts.medium,
      fontSize: type.bodyLarge - 1,
      color: colors.text,
    },
    subtitle: {
      marginTop: 1,
      fontFamily: fonts.regular,
      fontSize: type.caption,
      lineHeight: type.caption * 1.45,
      color: colors.muted,
    },
  });
