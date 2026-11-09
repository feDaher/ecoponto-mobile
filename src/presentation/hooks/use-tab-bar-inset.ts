import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Visible height of the floating tab bar, without the device's bottom safe area. */
export const TAB_BAR_HEIGHT = 76;

/**
 * Space the floating tab bar covers at the bottom of every tab.
 *
 * The bar is `position: 'absolute'` (so its rounded corners float over the
 * content), which means screens no longer shrink to make room for it. Each tab
 * pads the end of its scroll content with this value, or the last items stay
 * hidden behind the bar.
 */
export function useTabBarInset(): number {
  const { bottom } = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + bottom;
}
