import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { ArabicFontPicker } from '@/components/ArabicFontPicker';
import { DuaText } from '@/components/DuaText';
import { FontSizeStepper } from '@/components/FontSizeControl';
import { SettingsRow, SettingsSection } from '@/components/SettingsRow';
import { useBackupActions } from '@/backup/useBackupActions';
import { useDuas } from '@/state/DuaProvider';
import { useSettings } from '@/state/SettingsProvider';
import { FONT_SCALE } from '@/types/settings';
import { fonts, spacing, type, useThemedStyles, type Theme } from '@/theme';

export default function SettingsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { duas, folders } = useDuas();
  const { fontScale, resetFont } = useSettings();
  const { busy, exportAll, importFromFile } = useBackupActions();
  const count = duas.length;
  const countLabel = `${count} ${count === 1 ? 'dua' : 'duas'}`;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SettingsSection title="Text size">
        <View style={styles.readingCard}>
          <View style={styles.preview} accessibilityLabel="Text size preview">
            <DuaText variant="arabic">رَبِّ زِدْنِي عِلْمًا</DuaText>
            <DuaText variant="bengali">হে আমার রব, আমার জ্ঞান বৃদ্ধি করুন।</DuaText>
          </View>
          <FontSizeStepper />
          {fontScale !== FONT_SCALE.default ? (
            <Pressable onPress={resetFont} hitSlop={8} accessibilityRole="button" style={styles.reset}>
              <Text style={styles.resetLabel}>Reset to default</Text>
            </Pressable>
          ) : null}
        </View>
      </SettingsSection>

      <SettingsSection title="Arabic font">
        <ArabicFontPicker />
      </SettingsSection>

      <SettingsSection
        title="Backup"
        footer="Backups are plain files. Save one to Files, Google Drive or email so you can restore your duas on a new phone."
      >
        <SettingsRow
          icon="export"
          title="Export backup"
          subtitle={count === 0 ? 'Add a dua first' : `Save all ${countLabel}${folders.length ? ' and folders' : ''} to a file`}
          onPress={exportAll}
          disabled={count === 0 || busy === 'import'}
          loading={busy === 'export'}
        />
        <SettingsRow
          icon="import"
          title="Import backup"
          subtitle="Add or restore duas from a backup file"
          onPress={importFromFile}
          disabled={busy === 'export'}
          loading={busy === 'import'}
          divider
        />
      </SettingsSection>

      <Text style={styles.about}>
        {countLabel} saved on this device{'\n'}Version {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScrollView>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
      maxWidth: 720,
      width: '100%',
      alignSelf: 'center',
    },
    readingCard: {
      padding: spacing.md,
      gap: spacing.md,
    },
    preview: {
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    reset: {
      alignSelf: 'center',
      minHeight: 32,
      justifyContent: 'center',
    },
    resetLabel: {
      fontFamily: fonts.medium,
      fontSize: type.body,
      color: colors.accent,
    },
    about: {
      textAlign: 'center',
      fontFamily: fonts.regular,
      fontSize: type.caption,
      lineHeight: type.caption * 1.6,
      color: colors.faint,
    },
  });
