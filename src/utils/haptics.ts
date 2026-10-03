import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Thin wrapper over react-native-haptic-feedback — one place that picks
// the right feedback type per interaction, so call sites just say what
// kind of thing happened (a tap, a confirm, a destructive action) rather
// than which raw iOS/Android haptic constant that maps to.
const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/** Light tap — every ordinary button press (AppButton picks this up centrally). */
export const hapticTap = () =>
  ReactNativeHapticFeedback.trigger('impactLight', options);

/** A confirm/success action actually completed. */
export const hapticSuccess = () =>
  ReactNativeHapticFeedback.trigger('notificationSuccess', options);

/** A destructive action (delete, cancel shipment, logout) was confirmed. */
export const hapticWarning = () =>
  ReactNativeHapticFeedback.trigger('notificationWarning', options);

/** An action failed. */
export const hapticError = () =>
  ReactNativeHapticFeedback.trigger('notificationError', options);
