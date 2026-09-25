import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, spacing, type, useThemedStyles, type Theme } from '@/theme';
import { Star } from './Ornament';

interface Props {
  title: string;
  message?: string;
  /** Actions, e.g. buttons. */
  children?: ReactNode;
}

export function EmptyState({ title, message, children }: Props) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Star size={22} />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    title: {
      marginTop: spacing.lg,
      fontFamily: fonts.semibold,
      fontSize: type.title,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      marginTop: spacing.sm,
      maxWidth: 320,
      fontFamily: fonts.regular,
      fontSize: type.body,
      lineHeight: type.body * 1.5,
      color: colors.muted,
      textAlign: 'center',
    },
    actions: {
      marginTop: spacing.lg,
      width: '100%',
      maxWidth: 360,
      gap: spacing.sm,
    },
  });
