export interface Settings {
  fontScale: number;
  arabicFont: ArabicFontId;
}

export const FONT_SCALE = {
  min: 0.8,
  max: 2.0,
  step: 0.1,
  default: 1.0,
} as const;

/** Clamps to the allowed range and rounds to one decimal to avoid float drift. */
export function clampFontScale(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return FONT_SCALE.default;
  const clamped = Math.min(FONT_SCALE.max, Math.max(FONT_SCALE.min, value));
  return Math.round(clamped * 10) / 10;
}

/** Arabic typefaces the reader can choose from. Display details live in `arabicFonts` (theme). */
export const ARABIC_FONT_IDS = ['naskh', 'indopak', 'amiri', 'scheherazade'] as const;

export type ArabicFontId = (typeof ARABIC_FONT_IDS)[number];

export const DEFAULT_ARABIC_FONT: ArabicFontId = 'naskh';

/** Falls back to the default for unknown or corrupted stored values. */
export function parseArabicFont(value: unknown): ArabicFontId {
  return ARABIC_FONT_IDS.find((id) => id === value) ?? DEFAULT_ARABIC_FONT;
}
