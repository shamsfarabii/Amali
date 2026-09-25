import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { ArabicFontId } from '@/types/settings';

export interface Palette {
  background: string;
  surface: string;
  surfacePressed: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  toast: string;
  onToast: string;
}

// "Lapis & porcelain": cool tile-work blues on porcelain white, deep lapis night in dark mode.
const light: Palette = {
  background: '#F3F5F9',
  surface: '#FFFFFF',
  surfacePressed: '#EAEEF6',
  text: '#172033',
  muted: '#5B6478',
  faint: '#8C94A6',
  border: '#DDE2EC',
  accent: '#28479A',
  accentSoft: '#E6ECF8',
  onAccent: '#FFFFFF',
  danger: '#B42318',
  toast: '#172033',
  onToast: '#F3F5F9',
};

const dark: Palette = {
  background: '#0D1322',
  surface: '#161E31',
  surfacePressed: '#1F2940',
  text: '#E7EBF4',
  muted: '#98A2B8',
  faint: '#6B7590',
  border: '#263049',
  accent: '#9DB4F2',
  accentSoft: '#1D2945',
  onAccent: '#0D1322',
  danger: '#F97066',
  toast: '#E7EBF4',
  onToast: '#0D1322',
};

/**
 * Custom fonts carry their weight in the family name; never combine them with `fontWeight`
 * (Android ignores the pairing).
 */
export const fonts = {
  regular: 'HindSiliguri_400Regular',
  medium: 'HindSiliguri_500Medium',
  semibold: 'HindSiliguri_600SemiBold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** UI type scale. Reading text (Arabic/Bengali) scales separately with the user's setting. */
export const type = {
  caption: 13,
  body: 15,
  bodyLarge: 17,
  title: 20,
  display: 28,
} as const;

/** Base sizes for reading text, multiplied by the user's font scale. */
export const readingSizes = {
  title: 22,
  arabic: 28,
  pronunciation: 17,
  bengali: 17,
  source: 14,
} as const;

export interface ArabicFont {
  name: string;
  description: string;
  /** Font family as registered with `useFonts` in the root layout. */
  family: string;
  /**
   * Size multiplier so every choice reads at about the same size. Fonts draw very differently at
   * the same point size (Noorehuda is ~30% narrower than Noto Naskh).
   */
  scale: number;
  /** Line height as a multiple of font size. Fonts with tall marks need more room to avoid clipping. */
  lineHeight: number;
}

/** The Arabic typefaces offered in Settings. All are bundled, so they work offline. */
export const arabicFonts: Record<ArabicFontId, ArabicFont> = {
  naskh: {
    name: 'Naskh',
    description: 'Clear, modern naskh (Noto Naskh Arabic)',
    family: 'NotoNaskhArabic_500Medium',
    scale: 1,
    lineHeight: 1.9,
  },
  indopak: {
    name: 'IndoPak',
    description: 'South Asian Quran style (Noorehuda)',
    family: 'Noorehuda',
    scale: 1.2,
    lineHeight: 1.9,
  },
  amiri: {
    name: 'Amiri',
    description: 'Classic book naskh',
    family: 'Amiri_400Regular',
    scale: 1.05,
    lineHeight: 2.1,
  },
  scheherazade: {
    name: 'Scheherazade',
    description: 'Large, open letters',
    family: 'ScheherazadeNew_500Medium',
    scale: 1,
    lineHeight: 2.1,
  },
};
export const TEXT_LINE_HEIGHT = 1.55;

export interface Theme {
  dark: boolean;
  colors: Palette;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return useMemo(() => ({ dark: isDark, colors: isDark ? dark : light }), [isDark]);
}

/**
 * Memoizes a theme-dependent StyleSheet. Define the factory at module level:
 * `const makeStyles = ({ colors }: Theme) => StyleSheet.create({ ... })`.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
