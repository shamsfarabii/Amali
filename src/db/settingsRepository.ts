import { clampFontScale, parseArabicFont, type ArabicFontId } from '@/types/settings';
import { getDatabase } from './database';

const FONT_SCALE_KEY = 'fontScale';
const ARABIC_FONT_KEY = 'arabicFont';
const WELCOME_SEEN_KEY = 'welcomeSeen';

async function getValue(key: string): Promise<string | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value;
}

async function setValue(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function getFontScale(): Promise<number> {
  const stored = await getValue(FONT_SCALE_KEY);
  return clampFontScale(stored === undefined ? undefined : Number(stored));
}

export async function setFontScale(value: number): Promise<number> {
  const scale = clampFontScale(value);
  await setValue(FONT_SCALE_KEY, String(scale));
  return scale;
}

export async function getArabicFont(): Promise<ArabicFontId> {
  return parseArabicFont(await getValue(ARABIC_FONT_KEY));
}

export async function setArabicFont(value: ArabicFontId): Promise<void> {
  await setValue(ARABIC_FONT_KEY, value);
}

export async function getWelcomeSeen(): Promise<boolean> {
  return (await getValue(WELCOME_SEEN_KEY)) === '1';
}

export async function setWelcomeSeen(): Promise<void> {
  await setValue(WELCOME_SEEN_KEY, '1');
}
