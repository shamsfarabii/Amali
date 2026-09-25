import { describe, expect, it } from '@jest/globals';
import { matchesQuery, normalizeText } from '@/utils/normalize';

describe('normalizeText', () => {
  it('strips harakat so vowelled and plain Arabic match', () => {
    expect(normalizeText('رَبَّنَا')).toBe(normalizeText('ربنا'));
  });

  it('removes tatweel', () => {
    expect(normalizeText('اللــه')).toBe(normalizeText('الله'));
  });

  it('unifies alef, ya and ta marbuta variants', () => {
    expect(normalizeText('أإآٱا')).toBe('ااااا');
    expect(normalizeText('على')).toBe(normalizeText('علي'));
    expect(normalizeText('رحمة')).toBe(normalizeText('رحمه'));
  });

  it('lowercases and collapses whitespace', () => {
    expect(normalizeText('  Surah   AL-Baqarah \n')).toBe('surah al-baqarah');
  });

  it('keeps Bengali text intact', () => {
    expect(normalizeText('হে আমাদের রব')).toBe('হে আমাদের রব');
  });
});

describe('matchesQuery', () => {
  const haystack = normalizeText('رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً হে আমাদের রব সূরা বাকারা');

  it('matches everything for an empty query', () => {
    expect(matchesQuery(haystack, '   ')).toBe(true);
  });

  it('matches Arabic typed without diacritics', () => {
    expect(matchesQuery(haystack, 'اتنا')).toBe(true);
  });

  it('matches Bengali', () => {
    expect(matchesQuery(haystack, 'বাকারা')).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(matchesQuery(haystack, 'xyz')).toBe(false);
  });
});
