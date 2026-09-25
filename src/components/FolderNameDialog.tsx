import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FOLDER_NAME_MAX } from '@/types/folder';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';

interface Props {
  visible: boolean;
  title: string;
  confirmLabel: string;
  initialName?: string;
  /** Returns an error message to show, or null when the name was saved. */
  onSubmit: (name: string) => Promise<string | null>;
  onClose: () => void;
}

/** A small cross-platform dialog for naming a folder (Alert.prompt only exists on iOS). */
export function FolderNameDialog({ visible, ...rest }: Props) {
  // Mounting the form only while visible resets its state every time the dialog opens.
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={rest.onClose} statusBarTranslucent>
      {visible ? <DialogForm {...rest} /> : null}
    </Modal>
  );
}

function DialogForm({ title, confirmLabel, initialName = '', onSubmit, onClose }: Omit<Props, 'visible'>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const message = await onSubmit(name);
      if (message) setError(message);
    } catch {
      setError('The folder couldn’t be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.card} accessibilityViewIsModal>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) setError(null);
          }}
          placeholder="Folder name, e.g. সকালের দোয়া"
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          maxLength={FOLDER_NAME_MAX}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
          accessibilityLabel="Folder name"
          style={[styles.input, error ? styles.inputError : null]}
        />
        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.action} accessibilityRole="button">
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={saving}
            hitSlop={8}
            style={[styles.action, saving && styles.disabled]}
            accessibilityRole="button"
          >
            <Text style={styles.confirm}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = ({ colors, dark }: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(23,32,51,0.35)',
    },
    card: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
      padding: spacing.lg,
      gap: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    title: {
      fontFamily: fonts.semibold,
      fontSize: type.title - 2,
      color: colors.text,
    },
    input: {
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.background,
      fontFamily: fonts.regular,
      fontSize: type.bodyLarge,
      color: colors.text,
    },
    inputError: {
      borderColor: colors.danger,
    },
    error: {
      marginTop: -spacing.sm,
      fontFamily: fonts.medium,
      fontSize: type.caption,
      color: colors.danger,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.lg,
    },
    action: {
      minHeight: 44,
      justifyContent: 'center',
    },
    disabled: {
      opacity: 0.4,
    },
    cancel: {
      fontFamily: fonts.medium,
      fontSize: type.bodyLarge,
      color: colors.muted,
    },
    confirm: {
      fontFamily: fonts.semibold,
      fontSize: type.bodyLarge,
      color: colors.accent,
    },
  });
