import ReactNativeHapticFeedback from 'react-native-haptic-feedback';





const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const hapticTap = () =>
  ReactNativeHapticFeedback.trigger('impactLight', options);

export const hapticSuccess = () =>
  ReactNativeHapticFeedback.trigger('notificationSuccess', options);

export const hapticWarning = () =>
  ReactNativeHapticFeedback.trigger('notificationWarning', options);

export const hapticError = () =>
  ReactNativeHapticFeedback.trigger('notificationError', options);
