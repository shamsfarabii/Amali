import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';

/** Space kept between the focused input and the top of the keyboard. */
const GAP = 24;

/**
 * Keeps a form's ScrollView usable while the keyboard is open: every field stays reachable by
 * scrolling, and the focused input is scrolled above the keyboard (also as a multiline input grows).
 *
 * iOS insets the ScrollView natively. Android draws edge-to-edge, so the window no longer resizes
 * for the keyboard; there the hook pads the bottom of the content by the part the keyboard covers.
 *
 * Spread `scrollProps` onto the ScrollView, add `keyboardInset` to its content's bottom padding,
 * and call `revealFocused` from inputs' `onFocus` / `onContentSizeChange`.
 */
export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const revealFocused = useCallback(() => {
    const scroll = scrollRef.current;
    const scrollHost = scroll?.getNativeScrollRef();
    const input = TextInput.State.currentlyFocusedInput();
    const top = keyboardTop.current;
    if (!scroll || !scrollHost || !input || top === null) return;
    scrollHost.measureInWindow((_sx, scrollTop) => {
      input.measureInWindow((_x, y, _w, height) => {
        const hiddenBelow = y + height + GAP - top;
        // A tall input can't fit entirely; never push its top out of view.
        const roomAbove = y - scrollTop - GAP;
        const delta = Math.min(hiddenBelow, roomAbove);
        if (delta > 0) scroll.scrollTo({ y: scrollY.current + delta, animated: true });
      });
    });
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      if (Platform.OS !== 'android') {
        revealFocused();
        return;
      }
      scrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, y, _w, height) => {
        setKeyboardInset(Math.max(0, y + height - event.endCoordinates.screenY));
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardInset(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [revealFocused]);

  // The padding has to be laid out before there is room to scroll into.
  useEffect(() => {
    if (keyboardInset === 0) return;
    const frame = requestAnimationFrame(revealFocused);
    return () => cancelAnimationFrame(frame);
  }, [keyboardInset, revealFocused]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  return {
    keyboardInset,
    revealFocused,
    scrollProps: {
      ref: scrollRef,
      onScroll,
      scrollEventThrottle: 16,
      automaticallyAdjustKeyboardInsets: true,
      keyboardShouldPersistTaps: 'handled' as const,
      keyboardDismissMode: Platform.OS === 'ios' ? ('interactive' as const) : ('none' as const),
    },
  };
}
