import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '@/state/SettingsProvider';
import { ARABIC_FONT_IDS } from '@/types/settings';
import { arabicFonts, fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon } from './Icon';

const SAMPLE = 'بِسْمِ اللّٰهِ';
const SAMPLE_SIZE = 24;

/** Radio list of Arabic typefaces, each previewed in its own font. Use inside a SettingsSection. */
export function ArabicFontPicker() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { arabicFontId, setArabicFont } = useSettings();

  return (
    <View accessibilityRole="radiogroup">
      {ARABIC_FONT_IDS.map((id, index) => {
        const font = arabicFonts[id];
        const selected = id === arabicFontId;
        const size = Math.round(SAMPLE_SIZE * font.scale);
        return (
          <Pressable
            key={id}
            onPress={() => setArabicFont(id)}
            android_ripple={{ color: colors.surfacePressed }}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={font.name}
            accessibilityHint={font.description}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <Icon name="check" size={13} color={colors.onAccent} /> : null}
            </View>
            <View style={[styles.body, index > 0 && styles.divider]}>
              <View style={styles.texts}>
                <Text style={styles.name}>{font.name}</Text>
                <Text style={styles.description}>{font.description}</Text>
              </View>
              <Text
                style={[styles.sample, { fontFamily: font.family, fontSize: size, lineHeight: size * font.lineHeight }]}
                maxFontSizeMultiplier={1.3}
                numberOfLines={1}
                importantForAccessibility="no"
                accessibilityElementsHidden
              >
                {SAMPLE}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: spacing.md,
    },
    rowPressed: {
      backgroundColor: colors.surfacePressed,
    },
    radio: {
      width: 22,
      height: 22,
      marginRight: spacing.md - 2,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.faint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    body: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 68,
      paddingRight: spacing.md,
      paddingVertical: spacing.xs,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    texts: {
      flex: 1,
    },
    name: {
      fontFamily: fonts.medium,
      fontSize: type.bodyLarge - 1,
      color: colors.text,
    },
    description: {
      marginTop: 1,
      fontFamily: fonts.regular,
      fontSize: type.caption,
      lineHeight: type.caption * 1.45,
      color: colors.muted,
    },
    sample: {
      flexShrink: 0,
      color: colors.text,
      writingDirection: 'rtl',
    },
  });
