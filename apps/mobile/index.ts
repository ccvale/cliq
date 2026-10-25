import { Platform } from 'react-native';

// The demo web build can be hosted at any path; Expo Router expects the app to start at "/".
if (Platform.OS === 'web' && process.env.EXPO_PUBLIC_DEMO === '1' && typeof window !== 'undefined' && window.location.pathname !== '/') {
  try {
    window.history.replaceState(null, '', '/');
  } catch {}
}

require('expo-router/entry');
