import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Registers this device for match and message notifications. Quietly does nothing where push isn't available. */
export async function registerForPush({ prompt }: { prompt: boolean }) {
  if (Platform.OS === 'web') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return; // Needs an EAS project; see README.
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && prompt) status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Matches and messages',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.registerPushToken(data, Platform.OS);
  } catch (err) {
    console.warn('push registration failed', err);
  }
}
