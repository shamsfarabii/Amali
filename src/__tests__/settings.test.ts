import { describe, expect, it } from '@jest/globals';
import { DEFAULT_ARABIC_FONT, FONT_SCALE, clampFontScale, parseArabicFont } from '@/types/settings';

describe('clampFontScale', () => {
  it('falls back to the default for corrupted values', () => {
    expect(clampFontScale(undefined)).toBe(FONT_SCALE.default);
    expect(clampFontScale(Number('abc'))).toBe(FONT_SCALE.default);
    expect(clampFontScale(Infinity)).toBe(FONT_SCALE.default);
  });

  it('clamps to the allowed range', () => {
    expect(clampFontScale(0.1)).toBe(FONT_SCALE.min);
    expect(clampFontScale(9)).toBe(FONT_SCALE.max);
  });

  it('rounds away floating point drift', () => {
    expect(clampFontScale(1 + 0.1 + 0.1)).toBe(1.2);
  });
});

describe('parseArabicFont', () => {
  it('keeps a known font', () => {
    expect(parseArabicFont('amiri')).toBe('amiri');
  });

  it('falls back to the default for unknown or corrupted values', () => {
    expect(parseArabicFont(undefined)).toBe(DEFAULT_ARABIC_FONT);
    expect(parseArabicFont('comic-sans')).toBe(DEFAULT_ARABIC_FONT);
    expect(parseArabicFont(3)).toBe(DEFAULT_ARABIC_FONT);
  });
});
