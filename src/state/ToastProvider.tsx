import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius, spacing, type, useThemedStyles, type Theme } from '@/theme';

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 4000;
const WITH_ACTION_MS = 6000;
// Clears the bottom action bar / floating button on every screen.
const BOTTOM_OFFSET = 88;

/** One toast at a time, shown above screen content. Used for confirmations and Undo. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [progress]);

  const showToast = useCallback((options: ToastOptions) => {
    setToast({ ...options, key: Date.now() });
    AccessibilityInfo.announceForAccessibility(options.message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    timer.current = setTimeout(hide, toast.onAction ? WITH_ACTION_MS : VISIBLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast, progress, hide]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.key}
          pointerEvents="box-none"
          style={[
            styles.wrapper,
            { bottom: insets.bottom + BOTTOM_OFFSET },
            {
              opacity: progress,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
        >
          <View style={styles.toast} accessibilityLiveRegion="polite">
            <Text style={styles.message}>{toast.message}</Text>
            {toast.actionLabel && toast.onAction ? (
              <Pressable
                onPress={() => {
                  toast.onAction?.();
                  hide();
                }}
                hitSlop={12}
                accessibilityRole="button"
              >
                <Text style={styles.action}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      alignItems: 'center',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      maxWidth: 480,
      width: '100%',
      paddingVertical: spacing.md - 2,
      paddingHorizontal: spacing.md + 4,
      borderRadius: radius.md,
      backgroundColor: colors.toast,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    message: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: type.body,
      color: colors.onToast,
    },
    action: {
      fontFamily: fonts.semibold,
      fontSize: type.body,
      color: colors.onToast,
      textDecorationLine: 'underline',
    },
  });
