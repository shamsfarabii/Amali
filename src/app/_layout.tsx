import { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { NotoNaskhArabic_500Medium } from '@expo-google-fonts/noto-naskh-arabic';
import { ScheherazadeNew_500Medium } from '@expo-google-fonts/scheherazade-new';
import {
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
} from '@expo-google-fonts/hind-siliguri';
import { DuaProvider } from '@/state/DuaProvider';
import { SettingsProvider, useSettings } from '@/state/SettingsProvider';
import { ToastProvider } from '@/state/ToastProvider';
import { fonts, useTheme } from '@/theme';

// Keep the splash up until fonts and the first-launch flag are loaded, so nothing flashes.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Arabic choices (see `arabicFonts` in theme.ts).
    NotoNaskhArabic_500Medium,
    Noorehuda: require('../../assets/fonts/Noorehuda.ttf'),
    Amiri_400Regular,
    ScheherazadeNew_500Medium,
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
  });
  const { dark, colors } = useTheme();

  // The native root view shows through during screen transitions and before the first frame.
  // Keep it on the app background so there is no white flash, especially in dark mode.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  const navigationTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [dark, colors]);

  // Fonts are bundled, so this takes a moment at most. On failure the app falls back to system fonts.
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <ThemeProvider value={navigationTheme}>
      <SettingsProvider>
        <DuaProvider>
          <ToastProvider>
            <StatusBar style={dark ? 'light' : 'dark'} />
            <AppStack />
          </ToastProvider>
        </DuaProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

function AppStack() {
  const { colors } = useTheme();
  const { welcomeSeen } = useSettings();
  const ready = welcomeSeen !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Choosing between the welcome screen and the list needs the stored flag; the splash covers this.
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.accent,
        headerTitleStyle: { fontFamily: fonts.semibold, color: colors.text },
        headerLargeTitleStyle: { fontFamily: fonts.semibold, color: colors.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
        // Android's default transition fades through the window background; a slide keeps
        // both screens on screen for the whole animation.
        animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
      }}
    >
      {/* First launch only. Once dismissed, the guard flips and the router moves on to the list. */}
      <Stack.Protected guard={!welcomeSeen}>
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={welcomeSeen}>
        <Stack.Screen name="index" options={{ title: 'My Duas', animation: 'fade' }} />
        <Stack.Screen name="dua/[id]" options={{ title: '' }} />
        <Stack.Screen
          name="dua/form"
          options={{
            presentation: 'modal',
            // Android's standard transition for a screen opened on top: it rises and fades in, and
            // on close sinks and fades out as one piece (header and content together).
            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
          }}
        />
        <Stack.Screen name="folders" options={{ title: 'Folders' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack.Protected>
    </Stack>
  );
}
