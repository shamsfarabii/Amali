import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '@/brand';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { OrnamentDivider } from '@/components/Ornament';
import { useSettings } from '@/state/SettingsProvider';
import { arabicFonts, fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'source',
    title: 'Arabic, pronunciation and meaning',
    text: 'Keep each dua with its Bengali meaning and where it comes from.',
  },
  {
    icon: 'folder',
    title: 'Organised your way',
    text: 'Group duas into folders, like morning, evening or travel.',
  },
  {
    icon: 'lock',
    title: 'Private and offline',
    text: 'Everything stays on this device. Back up whenever you like.',
  },
];

/** Hero, verse and features, then the button: each part fades and rises in turn. */
const SECTIONS = 4;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { dismissWelcome } = useSettings();
  const [progress] = useState(() => Array.from({ length: SECTIONS }, () => new Animated.Value(0)));

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          progress.forEach((value) => value.setValue(1));
          return;
        }
        Animated.stagger(
          110,
          progress.map((value) =>
            Animated.timing(value, { toValue: 1, duration: 520, useNativeDriver: true }),
          ),
        ).start();
      });
    return () => {
      cancelled = true;
    };
  }, [progress]);

  const reveal = (index: number) => ({
    opacity: progress[index],
    transform: [{ translateY: progress[index].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        bounces={false}
      >
        <Animated.View style={[styles.hero, reveal(0)]}>
          <Image source={brand.logo} style={styles.logo} accessibilityIgnoresInvertColors accessible={false} />
          <Text style={styles.name} accessibilityRole="header">
            {brand.name}
          </Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </Animated.View>

        <Animated.View style={[styles.verse, reveal(1)]}>
          <OrnamentDivider />
          <Text style={styles.arabic} accessibilityLanguage="ar">
            ادْعُونِي أَسْتَجِبْ لَكُمْ
          </Text>
          <Text style={styles.translation}>“Call upon Me; I will respond to you.”</Text>
          <Text style={styles.reference}>Ghafir 40:60</Text>
        </Animated.View>

        <Animated.View style={[styles.features, reveal(2)]}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Icon name={feature.icon} size={20} color={colors.accent} />
              </View>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.footer, reveal(3)]}>
          <Button title="Get started" onPress={dismissWelcome} />
          <Text style={styles.note}>No account needed</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = ({ colors, dark }: Theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      gap: spacing.xl,
    },
    hero: {
      alignItems: 'center',
    },
    logo: {
      width: 96,
      height: 96,
      borderRadius: 22,
      marginBottom: spacing.lg,
    },
    name: {
      fontFamily: fonts.semibold,
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: 0.3,
      color: colors.text,
    },
    tagline: {
      marginTop: spacing.xs,
      fontFamily: fonts.regular,
      fontSize: type.bodyLarge,
      color: colors.muted,
      textAlign: 'center',
    },
    verse: {
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
    },
    arabic: {
      marginTop: spacing.md,
      fontFamily: arabicFonts.amiri.family,
      fontSize: 30,
      lineHeight: 30 * arabicFonts.amiri.lineHeight,
      color: colors.accent,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    translation: {
      fontFamily: fonts.medium,
      fontSize: type.body,
      color: colors.text,
      textAlign: 'center',
    },
    reference: {
      marginTop: 2,
      fontFamily: fonts.regular,
      fontSize: type.caption,
      color: colors.faint,
    },
    features: {
      width: '100%',
      maxWidth: 420,
      padding: spacing.md,
      gap: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: dark ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.border,
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSoft,
    },
    featureBody: {
      flex: 1,
    },
    featureTitle: {
      fontFamily: fonts.semibold,
      fontSize: type.body,
      color: colors.text,
    },
    featureText: {
      marginTop: 2,
      fontFamily: fonts.regular,
      fontSize: type.caption,
      lineHeight: type.caption * 1.5,
      color: colors.muted,
    },
    footer: {
      width: '100%',
      maxWidth: 420,
      marginTop: 'auto',
      gap: spacing.sm,
    },
    note: {
      fontFamily: fonts.regular,
      fontSize: type.caption,
      color: colors.faint,
      textAlign: 'center',
    },
  });
