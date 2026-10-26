import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { api, DEMO } from '@/lib/api';
import { DEMO_CODE } from '@/lib/demo';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';

/** Two steps: ask for a code by email, then enter it with a new password. Success signs you straight in. */
export default function ForgotPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { completeSignIn } = useSession();
  const { colors } = useTheme();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
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

  const sendCode = () =>
    run(async () => {
      await api.forgotPassword(email.trim());
      setStep('reset');
    });

  const reset = () => run(async () => completeSignIn(await api.resetPassword(email.trim(), code, password)));

  return (
    <Screen scroll keyboard edges={['top', 'bottom']} maxWidth={460}>
      <Pressable
        onPress={() => (step === 'reset' ? setStep('email') : router.back())}
        hitSlop={16}
        style={{ paddingVertical: 16, alignSelf: 'flex-start' }}
        accessibilityLabel="Back"
      >
        <ArrowLeft size={24} color={colors.ink} />
      </Pressable>

      {step === 'email' ? (
        <Animated.View key="email" entering={FadeInDown.duration(500)} style={{ gap: 18 }}>
          <View style={{ gap: 8, marginTop: 12, marginBottom: 14 }}>
            <Txt variant="display">Forgot your password?</Txt>
            <Txt tone="muted">It happens. We’ll email you a code to choose a new one.</Txt>
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
            onSubmitEditing={sendCode}
            placeholder="you@example.com"
            autoFocus
          />
          {error ? (
            <Txt variant="label" tone="danger">
              {error}
            </Txt>
          ) : null}
          <Button label="Email me a code" variant="accent" onPress={sendCode} loading={busy} disabled={!email.includes('@')} style={{ marginTop: 8 }} />
        </Animated.View>
      ) : (
        <Animated.View key="reset" entering={FadeInRight.duration(400)} style={{ gap: 18 }}>
          <View style={{ gap: 8, marginTop: 12, marginBottom: 14 }}>
            <Txt variant="display">Enter your code</Txt>
            <Txt tone="muted">
              If <Txt tone="ink">{email.trim()}</Txt> has a Cliq account, a code is on its way. It expires in 15 minutes.
            </Txt>
            {DEMO ? (
              <Txt variant="caption" tone="accent">
                Demo: use {DEMO_CODE}.
              </Txt>
            ) : null}
          </View>
          <CodeInput value={code} onChange={setCode} error={!!error && code.length === 6} />
          <View>
            <Field
              label="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!reveal}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={reset}
              placeholder="At least 10 characters"
              hint="Use 10+ characters with a number or symbol. You’ll be signed out everywhere else."
              style={{ paddingRight: 52 }}
            />
            <Pressable
              onPress={() => setReveal((r) => !r)}
              hitSlop={12}
              accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 16, top: 44 }}
            >
              {reveal ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
            </Pressable>
          </View>
          {error ? (
            <Txt variant="label" tone="danger">
              {error}
            </Txt>
          ) : null}
          <Button label="Set new password" variant="accent" onPress={reset} loading={busy} disabled={code.length !== 6 || !password} style={{ marginTop: 8 }} />
          <Button label="Send a new code" variant="ghost" size="md" onPress={sendCode} />
        </Animated.View>
      )}
    </Screen>
  );
}
