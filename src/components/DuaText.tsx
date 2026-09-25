import { StyleSheet, Text, type TextProps } from 'react-native';
import { useSettings } from '@/state/SettingsProvider';
import { TEXT_LINE_HEIGHT, fonts, readingSizes, useThemedStyles, type Theme } from '@/theme';

type Variant = keyof typeof readingSizes;

interface Props extends TextProps {
  variant: Variant;
  /** Overrides the variant's base size (before the user's text-size setting is applied). */
  baseSize?: number;
}

/** Reading text that follows the user's text size. Arabic uses the chosen Arabic font, right-to-left. */
export function DuaText({ variant, baseSize, style, ...rest }: Props) {
  const { fontScale, arabicFont } = useSettings();
  const styles = useThemedStyles(makeStyles);
  const isArabic = variant === 'arabic';
  const fontSize = Math.round((baseSize ?? readingSizes[variant]) * fontScale * (isArabic ? arabicFont.scale : 1));
  const lineHeight = Math.round(fontSize * (isArabic ? arabicFont.lineHeight : TEXT_LINE_HEIGHT));
  const family = isArabic ? { fontFamily: arabicFont.family } : null;

  // The app has its own text-size control, so system font scaling is capped to avoid double scaling.
  return <Text maxFontSizeMultiplier={1.3} {...rest} style={[styles[variant], family, { fontSize, lineHeight }, style]} />;
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    title: {
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    arabic: {
      color: colors.text,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    pronunciation: {
      fontFamily: fonts.regular,
      color: colors.muted,
    },
    bengali: {
      fontFamily: fonts.regular,
      color: colors.text,
    },
    source: {
      fontFamily: fonts.medium,
      color: colors.muted,
    },
  });
