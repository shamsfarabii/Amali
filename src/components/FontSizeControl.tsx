import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '@/state/SettingsProvider';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';

/** Two icon buttons for the header of the reading screen. */
export function FontSizeHeaderControl() {
  const { canDecrease, canIncrease, decreaseFont, increaseFont } = useSettings();
  return (
    <View style={styles.headerRow}>
      <IconButton icon="textSmaller" label="Smaller text" onPress={decreaseFont} disabled={!canDecrease} />
      <IconButton icon="textLarger" label="Larger text" onPress={increaseFont} disabled={!canIncrease} />
    </View>
  );
}

/** Full stepper for Settings: − 100% + */
export function FontSizeStepper() {
  const { fontScale, canDecrease, canIncrease, decreaseFont, increaseFont } = useSettings();
  const themed = useThemedStyles(makeStyles);
  const percent = Math.round(fontScale * 100);

  return (
    <View
      style={themed.stepper}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Text size"
      accessibilityValue={{ text: `${percent}%` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') increaseFont();
        if (event.nativeEvent.actionName === 'decrement') decreaseFont();
      }}
    >
      <StepButton icon="textSmaller" onPress={decreaseFont} disabled={!canDecrease} />
      <Text style={themed.value}>{percent}%</Text>
      <StepButton icon="textLarger" onPress={increaseFont} disabled={!canIncrease} />
    </View>
  );
}

function StepButton({ icon, onPress, disabled }: { icon: IconName; onPress: () => void; disabled: boolean }) {
  const { colors } = useTheme();
  const themed = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      importantForAccessibility="no"
      style={({ pressed }) => [themed.step, pressed && themed.stepPressed, disabled && themed.stepDisabled]}
    >
      <Icon name={icon} size={22} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      justifyContent: 'space-between',
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      padding: spacing.xs,
    },
    step: {
      width: 56,
      height: 44,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepPressed: {
      backgroundColor: colors.surface,
    },
    stepDisabled: {
      opacity: 0.3,
    },
    value: {
      fontFamily: fonts.semibold,
      fontSize: type.bodyLarge,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
  });
