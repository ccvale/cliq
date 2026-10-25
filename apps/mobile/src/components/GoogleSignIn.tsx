import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';
import { api } from '@/lib/api';
import { useSession } from '@/state/session';
import { Button } from './Button';
import { Txt } from './Txt';

// Closes the popup on web once Google redirects back.
WebBrowser.maybeCompleteAuthSession();

const clientIds = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};

/** True when a Google client id is set for this platform. Without one the button stays hidden. */
export const googleConfigured = Boolean(
  Platform.select({ web: clientIds.webClientId, ios: clientIds.iosClientId, android: clientIds.androidClientId }),
);

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </Svg>
  );
}

/**
 * Google sign in through the system browser (OAuth with PKCE). Only Google's signed ID token reaches
 * our API, which checks it against Google's public keys and the configured client ids.
 */
export function GoogleSignIn() {
  const { completeSignIn } = useSession();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(clientIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (response?.type === 'error') setError(response.error?.message ?? 'Google sign in failed');
    if (response?.type !== 'success') return setBusy(false);
    const idToken = response.params.id_token;
    if (!idToken) return setError('Google didn’t return a token');
    api
      .signInWithGoogle(idToken)
      .then(completeSignIn)
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, [response]);

  return (
    <>
      <Button
        label="Continue with Google"
        variant="secondary"
        icon={<GoogleMark />}
        loading={busy}
        disabled={!request}
        onPress={() => {
          setError(null);
          setBusy(true);
          void promptAsync();
        }}
      />
      {error ? (
        <Txt variant="caption" tone="danger" center>
          {error}
        </Txt>
      ) : null}
    </>
  );
}
