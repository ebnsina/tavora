import { AccessibilityInfo, Platform } from 'react-native';

// Durations drop to zero when the phone's "reduce motion" setting is on, like web's lib/motion.ts.
let reduce = false;
AccessibilityInfo.isReduceMotionEnabled().then((v) => (reduce = v));
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => (reduce = v));

export const ms = (d: number) => (reduce ? 0 : d);
export const native = Platform.OS !== 'web';
