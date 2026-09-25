import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { fonts, radius, spacing, type, useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon } from './Icon';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <Icon name="search" size={18} color={colors.faint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search Arabic, meaning or source"
        placeholderTextColor={colors.faint}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        selectionColor={colors.accent}
        accessibilityLabel="Search duas"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Icon name="clear" size={18} color={colors.faint} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md - 4,
      minHeight: 46,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.sm,
      fontFamily: fonts.regular,
      fontSize: type.body,
      color: colors.text,
    },
  });
