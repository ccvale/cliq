import { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { api } from '@/lib/api';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './Txt';

/** Native Sign in with Apple. The identity token is verified by our own API against Apple's public keys. */
export function AppleSignIn() {
  const { completeSignIn } = useSession();
  const { scheme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          scheme === 'dark'
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={28}
        style={{ height: 56 }}
        onPress={async () => {
          setError(null);
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });
            if (!credential.identityToken) throw new Error('Apple didn’t return a token');
            await completeSignIn(
              await api.signInWithApple(credential.identityToken, credential.fullName?.givenName ?? undefined),
            );
          } catch (e: any) {
            if (e?.code !== 'ERR_REQUEST_CANCELED') setError(e?.message ?? 'Apple sign in failed');
          }
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
