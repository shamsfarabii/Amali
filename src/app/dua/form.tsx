import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { HeaderButton } from '@/components/HeaderButton';
import { useFolderEditor } from '@/components/useFolderEditor';
import { useKeyboardAwareScroll } from '@/components/useKeyboardAwareScroll';
import { useDuas } from '@/state/DuaProvider';
import { useSettings } from '@/state/SettingsProvider';
import { useToast } from '@/state/ToastProvider';
import { LIMITS, normalizeInput, validateInput, type DuaInput, type DuaInputErrors } from '@/types/dua';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';

type TextField = keyof DuaInputErrors;

/**
 * Editing size for Arabic, a little above the other fields so the vowel marks stay legible.
 * The reading screen shows Arabic larger, scaled by the user's text size.
 */
const ARABIC_INPUT_SIZE = 20;

/** iOS 26+ draws bar buttons as glass; icon buttons are the platform convention there. */
const modernIOS = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;

export default function DuaFormScreen() {
  const params = useLocalSearchParams<{ id?: string; folderId?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { arabicFont } = useSettings();
  const { folders, getById, getFolder, createDua, updateDua } = useDuas();
  const { showToast } = useToast();
  const folderEditor = useFolderEditor();
  const { scrollProps, keyboardInset, revealFocused } = useKeyboardAwareScroll();
  const arabicRef = useRef<TextInput>(null);

  const existing = params.id ? getById(params.id) : undefined;
  const [initial] = useState<DuaInput>(() =>
    existing
      ? {
          title: existing.title,
          arabic: existing.arabic,
          pronunciation: existing.pronunciation,
          bengali: existing.bengali,
          source: existing.source,
          folderId: existing.folderId,
        }
      : {
          title: '',
          arabic: '',
          pronunciation: '',
          bengali: '',
          source: '',
          // Opened from a folder: start in that folder.
          folderId: params.folderId && getFolder(params.folderId) ? params.folderId : null,
        },
  );

  const [values, setValues] = useState<DuaInput>(initial);
  const [errors, setErrors] = useState<DuaInputErrors>({});
  const [saving, setSaving] = useState(false);
  const saved = useRef(false);

  const dirty = (Object.keys(initial) as (keyof DuaInput)[]).some((key) => values[key] !== initial[key]);

  // Ask before throwing away unsaved changes (back button, swipe down, or Cancel).
  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (!dirty || saved.current) return;
      event.preventDefault();
      Alert.alert('Discard changes?', 'What you typed will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(event.data.action) },
      ]);
    });
  }, [navigation, dirty]);

  if (params.id && !existing) {
    return <EmptyState title="This dua isn’t here anymore" message="It may have been deleted." />;
  }

  const setField = (field: TextField) => (text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setFolder = (folderId: string | null) => setValues((prev) => ({ ...prev, folderId }));

  // Android: close the keyboard before leaving. Otherwise it collapses during the exit animation and
  // the form re-lays out while it slides away, so the content and header don't leave together.
  const close = () => {
    if (Platform.OS !== 'android' || !Keyboard.isVisible()) {
      router.back();
      return;
    }
    let done = false;
    const leave = () => {
      if (done) return;
      done = true;
      subscription.remove();
      router.back();
    };
    const subscription = Keyboard.addListener('keyboardDidHide', leave);
    setTimeout(leave, 350); // in case the hide event never arrives
    Keyboard.dismiss();
  };
  // Nothing to save when an existing dua hasn't changed.
  const canSave = !saving && (!existing || dirty);

  const save = async () => {
    const input = normalizeInput(values);
    // Guard against a folder deleted while this form was open.
    if (input.folderId && !getFolder(input.folderId)) input.folderId = null;
    const validation = validateInput(input);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setSaving(true);
    try {
      if (existing) await updateDua(existing, input);
      else await createDua(input);
      saved.current = true;
      close();
      showToast({ message: existing ? 'Changes saved' : 'Dua added' });
    } catch {
      setSaving(false);
      Alert.alert('Couldn’t save', 'Your text is still here. Try saving again.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: existing ? 'Edit dua' : 'New dua',
          // iOS: native bar buttons, so they get the system look (Liquid Glass on iOS 26)
          // instead of custom views drawn inside the system's own button background.
          unstable_headerLeftItems: () => [
            modernIOS
              ? { type: 'button', label: 'Cancel', icon: { type: 'sfSymbol', name: 'xmark' }, onPress: close, disabled: saving }
              : { type: 'button', label: 'Cancel', onPress: close, disabled: saving },
          ],
          unstable_headerRightItems: () => [
            modernIOS
              ? {
                  type: 'button',
                  label: 'Save',
                  icon: { type: 'sfSymbol', name: 'checkmark' },
                  variant: 'prominent',
                  tintColor: colors.accent,
                  onPress: save,
                  disabled: !canSave,
                }
              : { type: 'button', label: 'Save', variant: 'done', onPress: save, disabled: !canSave },
          ],
          // Android (and fallback): Material full-screen dialog style.
          headerLeft: () => <HeaderButton label="Cancel" onPress={close} disabled={saving} />,
          headerRight: () => <HeaderButton label="Save" primary onPress={save} loading={saving} disabled={!canSave} />,
        }}
      />
      <ScrollView
        {...scrollProps}
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + keyboardInset }]}
      >
        <Section title="Dua">
          <Field
            label="Title"
            value={values.title}
            onChangeText={setField('title')}
            error={errors.title}
            limit={LIMITS.title}
            placeholder="e.g. ঘুম থেকে ওঠার দোয়া"
            autoFocus={!existing}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => arabicRef.current?.focus()}
            onReveal={revealFocused}
          />
          <Field
            ref={arabicRef}
            label="Arabic"
            value={values.arabic}
            onChangeText={setField('arabic')}
            error={errors.arabic}
            limit={LIMITS.arabic}
            multiline
            inputStyle={[
              styles.arabicInput,
              {
                fontFamily: arabicFont.family,
                fontSize: Math.round(ARABIC_INPUT_SIZE * arabicFont.scale),
                lineHeight: Math.round(ARABIC_INPUT_SIZE * arabicFont.scale * arabicFont.lineHeight),
              },
            ]}
            textAlign="right"
            placeholder="اكتب الدعاء هنا"
            onReveal={revealFocused}
          />
        </Section>

        <Section title="Reading & meaning">
          <Field
            label="Pronunciation"
            optional
            hint="How to read the Arabic, e.g. in Bengali letters."
            value={values.pronunciation}
            onChangeText={setField('pronunciation')}
            error={errors.pronunciation}
            limit={LIMITS.pronunciation}
            multiline
            inputStyle={styles.multiline}
            placeholder="উচ্চারণ লিখুন"
            onReveal={revealFocused}
          />
          <Field
            label="Bengali meaning"
            value={values.bengali}
            onChangeText={setField('bengali')}
            error={errors.bengali}
            limit={LIMITS.bengali}
            multiline
            inputStyle={styles.multiline}
            placeholder="দোয়ার অর্থ লিখুন"
            onReveal={revealFocused}
          />
        </Section>

        <Section title="Reference">
          <Field
            label="Source"
            optional
            hint="For example: সূরা বাকারা ২:২০১, or Sahih Muslim 2722"
            value={values.source}
            onChangeText={setField('source')}
            error={errors.source}
            limit={LIMITS.source}
            returnKeyType="done"
            onReveal={revealFocused}
          />
          <View style={styles.field}>
            <Text style={styles.label}>Folder</Text>
            <View style={styles.chips}>
              <Chip label="No folder" selected={values.folderId === null} onPress={() => setFolder(null)} />
              {folders.map((folder) => (
                <Chip
                  key={folder.id}
                  icon="folder"
                  label={folder.name}
                  selected={values.folderId === folder.id}
                  onPress={() => setFolder(folder.id)}
                />
              ))}
              <Chip
                icon="folderAdd"
                label="New folder"
                onPress={() => folderEditor.openCreate((folder) => setFolder(folder.id))}
              />
            </View>
          </View>
        </Section>
      </ScrollView>
      {folderEditor.dialog}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

interface FieldProps extends Omit<TextInputProps, 'style'> {
  ref?: Ref<TextInput>;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  limit: number;
  inputStyle?: StyleProp<TextStyle>;
  /** Scrolls the focused input above the keyboard. */
  onReveal: () => void;
}

function Field({ ref, label, optional, hint, error, limit, inputStyle, onReveal, value = '', ...inputProps }: FieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);
  // Only show a counter once someone is getting close to the limit.
  const showCounter = value.length > limit * 0.8;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      <TextInput
        ref={ref}
        value={value}
        maxLength={limit}
        placeholderTextColor={colors.faint}
        selectionColor={colors.accent}
        accessibilityLabel={label}
        accessibilityHint={hint}
        textAlignVertical="top"
        onFocus={() => {
          setFocused(true);
          onReveal();
        }}
        onBlur={() => setFocused(false)}
        // A multiline input grows as you type; keep the line being written above the keyboard.
        onContentSizeChange={inputProps.multiline ? onReveal : undefined}
        style={[styles.input, inputStyle, focused && styles.inputFocused, error ? styles.inputError : null]}
        {...inputProps}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
      {showCounter ? (
        <Text style={styles.counter}>
          {value.length} / {limit}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      gap: spacing.lg,
      maxWidth: 720,
      width: '100%',
      alignSelf: 'center',
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      paddingHorizontal: spacing.xs,
      fontFamily: fonts.semibold,
      fontSize: type.caption,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    card: {
      gap: spacing.md + 4,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    field: {
      gap: 6,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    label: {
      fontFamily: fonts.semibold,
      fontSize: type.body,
      color: colors.text,
    },
    optional: {
      fontFamily: fonts.regular,
      fontSize: type.caption,
      color: colors.faint,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontFamily: fonts.regular,
      fontSize: type.bodyLarge,
      color: colors.text,
    },
    inputFocused: {
      borderColor: colors.accent,
    },
    inputError: {
      borderColor: colors.danger,
    },
    multiline: {
      minHeight: 96,
      lineHeight: type.bodyLarge * 1.5,
    },
    // Font, size and line height come from the chosen Arabic font (see ARABIC_INPUT_SIZE).
    arabicInput: {
      minHeight: 120,
      writingDirection: 'rtl',
    },
    hint: {
      paddingHorizontal: 2,
      fontFamily: fonts.regular,
      fontSize: type.caption,
      lineHeight: type.caption * 1.5,
      color: colors.muted,
    },
    error: {
      paddingHorizontal: 2,
      fontFamily: fonts.medium,
      fontSize: type.caption,
      color: colors.danger,
    },
    counter: {
      alignSelf: 'flex-end',
      paddingHorizontal: 2,
      fontFamily: fonts.regular,
      fontSize: type.caption,
      color: colors.faint,
      fontVariant: ['tabular-nums'],
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingTop: 2,
    },
  });
