import { AppText } from '@/presentation/components/ui/text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Room kept above the focused input so its label stays visible. */
const FOCUSED_INPUT_TOP_GAP = 96;
/** Lets `KeyboardAvoidingView` apply its padding before we scroll. */
const SCROLL_AFTER_KEYBOARD_MS = 80;

export type AuthLayoutProps = {
  title: string;
  subtitle: string;
  icon?: IconName;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, icon, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  const { scrollRef, contentRef } = useScrollToFocusedInput();

  return (
    <View className="flex-1 bg-brand-600">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        // Android is edge-to-edge (SDK 57): the window no longer resizes for the
        // keyboard, so `height` does nothing useful there. `padding` works on both.
        behavior="padding"
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          bounces={false}
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View ref={contentRef} className="grow">
            <View
              className="grow justify-end overflow-hidden px-10 pb-8"
              style={{ paddingTop: insets.top + 8 }}
            >
              {icon ? (
                <View
                  className="mb-4 items-center"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <MaterialCommunityIcons name={icon} size={88} color="#FFFFFF" />
                </View>
              ) : null}

              <View className="gap-1">
                <AppText variant="display" tone="inverse" accessibilityRole="header">
                  {title}
                </AppText>
                <AppText variant="body" tone="inverse" className="opacity-90">
                  {subtitle}
                </AppText>
              </View>
            </View>

            <View
              className="rounded-t-[40px] bg-surface-light px-11 pt-10 dark:bg-surface-dark"
              style={{ paddingBottom: insets.bottom + 16 }}
            >
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * Scrolls the form so the focused input sits above the keyboard.
 *
 * `KeyboardAvoidingView` only shrinks the visible area; the form lives at the
 * bottom of a tall layout, so without this the scroll stays at the top and the
 * keyboard keeps covering the field. `react-native-keyboard-controller` does this
 * natively, but it is not available on Expo Go.
 */
function useScrollToFocusedInput() {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const scrollView = scrollRef.current;
        const content = contentRef.current;
        const input = TextInput.State.currentlyFocusedInput();
        if (!scrollView || !content || !input) return;

        input.measureLayout(
          content,
          (_x, y) => scrollView.scrollTo({ y: Math.max(0, y - FOCUSED_INPUT_TOP_GAP) }),
          () => undefined,
        );
      }, SCROLL_AFTER_KEYBOARD_MS);
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return { scrollRef, contentRef };
}
