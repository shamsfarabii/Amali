import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon, type IconName } from './Icon';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ title, onPress, variant = 'primary', icon, disabled = false, loading = false }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const inactive = disabled || loading;
  const color = variant === 'primary' ? colors.onAccent : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, inactive && styles.inactive]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={20} color={color} /> : null}
          <Text style={[styles.label, { color }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: colors.accent,
    },
    secondary: {
      backgroundColor: colors.accentSoft,
    },
    pressed: {
      opacity: 0.75,
    },
    inactive: {
      opacity: 0.45,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    label: {
      fontFamily: fonts.semibold,
      fontSize: type.bodyLarge,
    },
  });
