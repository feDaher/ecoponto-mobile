import { useIsFocused } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';

/** Space kept below the focused input, so its hint/error line and some context show. */
const REVEAL_MARGIN = 72;
/** Lets `KeyboardAvoidingView` apply its padding before measuring what is visible. */
const REVEAL_DELAY_MS = 80;

export type KeyboardAwareScrollViewProps = ScrollViewProps & {
  /**
   * Height of whatever sits above this view on screen, usually the Stack header
   * (`useHeaderHeight()` from `expo-router/react-navigation`). `KeyboardAvoidingView`
   * measures itself relative to its parent, so without it the overlap comes out short.
   */
  keyboardVerticalOffset?: number;
  children: ReactNode;
};

/**
 * ScrollView that keeps the focused input above the keyboard.
 *
 * Two parts: `KeyboardAvoidingView` with `padding` shrinks the visible area (Android
 * is edge-to-edge on SDK 57, so the window no longer resizes and `height` does
 * nothing there), and, once the keyboard is up, the view scrolls just enough to
 * reveal the focused input when it is hidden. `react-native-keyboard-controller`
 * does this natively, but it does not run on Expo Go.
 *
 * Only reacts while its screen is focused: screens below in the Stack stay
 * mounted and must not scroll in the background.
 */
export function KeyboardAwareScrollView({
  keyboardVerticalOffset = 0,
  onScroll,
  children,
  ...props
}: KeyboardAwareScrollViewProps) {
  const viewportRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const viewport = viewportRef.current;
        const input = TextInput.State.currentlyFocusedInput();
        if (!viewport || !input) return;

        viewport.measureInWindow((_vx, viewportY, _vw, viewportHeight) => {
          input.measureInWindow((_ix, inputY, _iw, inputHeight) => {
            // An input above this view (e.g. a header search) is not ours to reveal.
            if (inputY + inputHeight <= viewportY) return;

            const hiddenBy = inputY + inputHeight + REVEAL_MARGIN - (viewportY + viewportHeight);
            if (hiddenBy <= 0) return;

            scrollRef.current?.scrollTo({ y: scrollY.current + hiddenBy });
          });
        });
      }, REVEAL_DELAY_MS);
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [isFocused]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={{ flex: 1 }}
    >
      {/* Measured to know the area left visible above the keyboard. */}
      <View ref={viewportRef} style={{ flex: 1 }} collapsable={false}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          {...props}
        >
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
