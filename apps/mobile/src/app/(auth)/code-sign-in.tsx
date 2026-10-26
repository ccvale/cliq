import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { api, DEMO } from '@/lib/api';
import { DEMO_CODE } from '@/lib/demo';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';

/** Passwordless sign in: we email a 6-digit code to the account's address. */
export default function CodeSignIn() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { completeSignIn } = useSession();
  const { colors } = useTheme();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const send = () =>
    run(async () => {
      await api.sendSignInCode(email.trim());
      setStep('code');
    });
  const verify = (value = code) =>
    run(async () => {
      try {
        await completeSignIn(await api.signInWithCode(email.trim(), value));
      } catch (e) {
        setCode('');
        throw e;
      }
    });

  return (
    <Screen scroll keyboard edges={['top', 'bottom']} maxWidth={460}>
      <Pressable
        onPress={() => (step === 'code' ? setStep('email') : router.back())}
        hitSlop={16}
        style={{ paddingVertical: 16, alignSelf: 'flex-start' }}
        accessibilityLabel="Back"
      >
        <ArrowLeft size={24} color={colors.ink} />
      </Pressable>
      {step === 'email' ? (
        <Animated.View key="email" entering={FadeInDown.duration(500)} style={{ gap: 18 }}>
          <View style={{ gap: 8, marginTop: 12, marginBottom: 14 }}>
            <Txt variant="display">Sign in with a code</Txt>
            <Txt tone="muted">No password needed. We’ll email you a 6-digit code.</Txt>
          </View>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={send}
            placeholder="you@example.com"
            autoFocus
          />
          {error ? (
            <Txt variant="label" tone="danger">
              {error}
            </Txt>
          ) : null}
          <Button label="Email me a code" variant="accent" onPress={send} loading={busy} disabled={!email.includes('@')} style={{ marginTop: 8 }} />
        </Animated.View>
      ) : (
        <Animated.View key="code" entering={FadeInRight.duration(400)} style={{ gap: 18 }}>
          <View style={{ gap: 8, marginTop: 12, marginBottom: 14 }}>
            <Txt variant="display">Check your inbox</Txt>
            <Txt tone="muted">
              If <Txt tone="ink">{email.trim()}</Txt> has a Cliq account, a code is on its way. It expires in 15 minutes.
            </Txt>
            {DEMO ? (
              <Txt variant="caption" tone="accent">
                Demo: use {DEMO_CODE}.
              </Txt>
            ) : null}
          </View>
          <CodeInput value={code} onChange={setCode} onComplete={verify} error={!!error} />
          {error ? (
            <Txt variant="label" tone="danger" center>
              {error}
            </Txt>
          ) : null}
          <Button label="Sign in" variant="accent" onPress={() => verify()} loading={busy} disabled={code.length !== 6} />
          <Button label="Send a new code" variant="ghost" size="md" onPress={send} />
        </Animated.View>
      )}
    </Screen>
  );
}
