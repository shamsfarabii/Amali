import { StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '@/theme';

interface StarProps {
  size?: number;
  color?: string;
}

/** Eight-point star (khatam), drawn as two overlapping squares. */
export function Star({ size = 12, color }: StarProps) {
  const { colors } = useTheme();
  const square = { width: size, height: size, backgroundColor: color ?? colors.accent };
  // A square rotated 45° needs a box of size·√2 to fit without clipping.
  const box = Math.ceil(size * Math.SQRT2);
  return (
    <View
      style={[staticStyles.star, { width: box, height: box }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <View style={square} />
      <View style={[square, staticStyles.rotated]} />
    </View>
  );
}

/** A hairline with a star in the middle: separates the Arabic text from its meaning. */
export function OrnamentDivider() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no">
      <View style={styles.line} />
      <Star size={9} />
      <View style={styles.line} />
    </View>
  );
}

const staticStyles = StyleSheet.create({
  star: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotated: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
});

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    line: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
  });
