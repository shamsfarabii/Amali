import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_ARABIC_FONT, FONT_SCALE, clampFontScale, type ArabicFontId } from '@/types/settings';
import * as settingsRepo from '@/db/settingsRepository';
import { arabicFonts, type ArabicFont } from '@/theme';

interface SettingsContextValue {
  fontScale: number;
  canIncrease: boolean;
  canDecrease: boolean;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  arabicFontId: ArabicFontId;
  /** The chosen Arabic typeface, with its size and line-height adjustments. */
  arabicFont: ArabicFont;
  setArabicFont: (id: ArabicFontId) => void;
  /** Whether the welcome screen was dismissed. `null` while loading. */
  welcomeSeen: boolean | null;
  dismissWelcome: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScale] = useState<number>(FONT_SCALE.default);
  const [arabicFontId, setArabicFontId] = useState<ArabicFontId>(DEFAULT_ARABIC_FONT);
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);
  // Ignore a stored value if the user changed that setting before it finished loading.
  const touched = useRef(false);
  const fontTouched = useRef(false);

  useEffect(() => {
    settingsRepo
      .getFontScale()
      .then((stored) => {
        if (!touched.current) setFontScale(stored);
      })
      .catch(() => {
        // Keep the default; font size is not critical.
      });
    settingsRepo
      .getArabicFont()
      .then((stored) => {
        if (!fontTouched.current) setArabicFontId(stored);
      })
      .catch(() => {
        // Keep the default font.
      });
    settingsRepo
      .getWelcomeSeen()
      .then((seen) => setWelcomeSeen((current) => current ?? seen))
      .catch(() => {
        // Skip the welcome rather than block the app on a broken database.
        setWelcomeSeen((current) => current ?? true);
      });
  }, []);

  const dismissWelcome = useCallback(() => {
    setWelcomeSeen(true);
    settingsRepo.setWelcomeSeen().catch(() => {
      // It shows again next launch; harmless.
    });
  }, []);

  const setArabicFont = useCallback((id: ArabicFontId) => {
    fontTouched.current = true;
    setArabicFontId(id);
    settingsRepo.setArabicFont(id).catch(() => {
      // The font still applies for this session.
    });
  }, []);

  const change = useCallback(
    (delta: number) => {
      touched.current = true;
      const next = clampFontScale(fontScale + delta);
      setFontScale(next);
      settingsRepo.setFontScale(next).catch(() => {
        // The size still applies for this session.
      });
    },
    [fontScale],
  );

  const value = useMemo(
    () => ({
      fontScale,
      canIncrease: fontScale < FONT_SCALE.max,
      canDecrease: fontScale > FONT_SCALE.min,
      increaseFont: () => change(FONT_SCALE.step),
      decreaseFont: () => change(-FONT_SCALE.step),
      resetFont: () => change(FONT_SCALE.default - fontScale),
      arabicFontId,
      arabicFont: arabicFonts[arabicFontId],
      setArabicFont,
      welcomeSeen,
      dismissWelcome,
    }),
    [fontScale, change, arabicFontId, setArabicFont, welcomeSeen, dismissWelcome],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
