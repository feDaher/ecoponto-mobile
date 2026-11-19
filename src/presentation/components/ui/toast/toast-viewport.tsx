import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastCard } from './toast';
import { useToastStore } from './toast.store';

/**
 * Where toasts are drawn: a vertical list pinned to the top, under the status
 * bar, one card below the other. Mount it once, after the navigator, so it
 * floats over every screen.
 *
 * `pointerEvents="box-none"` lets taps outside the cards reach the screen.
 */
export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 top-0 items-center px-4"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View pointerEvents="box-none" className="w-full max-w-[520px] gap-2">
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(220)}
            exiting={FadeOutUp.duration(180)}
            layout={LinearTransition.duration(200)}
          >
            <ToastCard toast={toast} onDismiss={dismiss} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
