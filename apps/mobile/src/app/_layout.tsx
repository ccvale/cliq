import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SessionProvider, useSession } from '@/state/session';
import { MatchesProvider } from '@/state/matches';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { LockScreen } from '@/components/LockScreen';
import { AchievementToast } from '@/components/AchievementToast';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>{fontsLoaded ? <Themed /> : null}</SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Themed() {
  const { me } = useSession();
  return (
    <ThemeProvider palette={me?.profile.palette}>
      <MatchesProvider>
        <Navigator />
      </MatchesProvider>
    </ThemeProvider>
  );
}

function Navigator() {
  const { status, me, locked } = useSession();
  const { colors, scheme } = useTheme();

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);
  if (status === 'loading') return null;

  const signedIn = status === 'signedIn';
  const onboarded = !!me?.profile.onboarded;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="blocked" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="devices" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="two-factor-setup" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="verify-email" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen
            name="match/[id]"
            options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
          />
        </Stack.Protected>
      </Stack>
      {signedIn && onboarded && !locked ? <AchievementToast /> : null}
      {locked ? <LockScreen /> : null}
    </>
  );
}
