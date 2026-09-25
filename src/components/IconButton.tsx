import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';

interface Props {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

/** Icon-only button with a 44pt touch target. `label` is read by screen readers. */
export function IconButton({ icon, label, onPress, disabled = false, size = 22 }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      android_ripple={{ color: colors.surfacePressed, borderless: true, radius: 22 }}
      style={({ pressed }) => [styles.button, (pressed || disabled) && { opacity: disabled ? 0.3 : 0.6 }]}
    >
      <Icon name={icon} size={size} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
