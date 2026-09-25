// Arabic harakat, Quranic annotation marks, superscript alef and tatweel.
const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

/**
 * Normalizes text for search and duplicate detection:
 * - strips Arabic diacritics and tatweel
 * - unifies alef / ya / ta marbuta variants
 * - lowercases and collapses whitespace
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(ARABIC_MARKS, '')
    .replace(/[آأإٱ]/g, 'ا') // آ أ إ ٱ → ا
    .replace(/ى/g, 'ي') // ى → ي
    .replace(/ة/g, 'ه') // ة → ه
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesQuery(haystack: string, query: string): boolean {
  const q = normalizeText(query);
  return q === '' || haystack.includes(q);
}
