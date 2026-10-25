import { useRef, useState } from 'react';
import { Pressable, View, type TextInputInstance } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { api, DEMO } from '@/lib/api';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Field } from './Field';
import { Screen } from './Screen';
import { Txt } from './Txt';

/** Shared email + password form for sign up and sign in. */
export function AuthForm({ mode }: { mode: 'signUp' | 'signIn' }) {
  const { completeSignIn } = useSession();
  const { colors } = useTheme();
  const signUpMode = mode === 'signUp';
  const [email, setEmail] = useState(DEMO && !signUpMode ? 'demo@cliq.app' : '');
  const [password, setPassword] = useState(DEMO && !signUpMode ? 'cliq-demo-2024' : '');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);
  const signUp = mode === 'signUp';

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const tokens = signUp ? await api.signUp(email, password) : await api.signIn(email, password);
      await completeSignIn(tokens);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom']} maxWidth={460}>
      <Pressable onPress={() => router.back()} hitSlop={16} style={{ paddingVertical: 16, alignSelf: 'flex-start' }} accessibilityLabel="Back">
        <ArrowLeft size={24} color={colors.ink} />
      </Pressable>
      <Animated.View entering={FadeInDown.duration(500)} style={{ gap: 8, marginTop: 12, marginBottom: 32 }}>
        <Txt variant="display">{signUp ? 'Create your account' : 'Welcome back'}</Txt>
        <Txt tone="muted">
          {signUp ? 'It takes a minute. Your profile comes next.' : 'Your friends missed you.'}
        </Txt>
        {DEMO ? (
          <Txt variant="caption" tone="accent" style={{ marginTop: 4 }}>
            {signUp
              ? 'Demo: any email works. You’ll go through onboarding with a fresh profile.'
              : 'Demo: sign in to a ready-made profile with friends and chats.'}
          </Txt>
        ) : null}
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ gap: 18 }}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="you@example.com"
        />
        <View>
          <Field
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!reveal}
            autoComplete={signUp ? 'new-password' : 'current-password'}
            textContentType={signUp ? 'newPassword' : 'password'}
            returnKeyType="go"
            onSubmitEditing={submit}
            placeholder={signUp ? 'At least 10 characters' : '••••••••••'}
            hint={signUp ? 'Use 10+ characters with a number or symbol.' : undefined}
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
        {!signUp ? (
          <Pressable
            onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
            hitSlop={8}
            style={{ alignSelf: 'flex-end', marginTop: -6 }}
          >
            <Txt variant="label" tone="accent">
              Forgot password?
            </Txt>
          </Pressable>
        ) : null}
        {error ? (
          <Txt variant="label" tone="danger">
            {error}
          </Txt>
        ) : null}
        <Button
          label={signUp ? 'Create account' : 'Sign in'}
          variant="accent"
          onPress={submit}
          loading={busy}
          disabled={!email || !password}
          style={{ marginTop: 8 }}
        />
        <Button
          label={signUp ? 'I already have an account' : 'New here? Create an account'}
          variant="ghost"
          size="md"
          onPress={() => router.replace(signUp ? '/sign-in' : '/sign-up')}
        />
      </Animated.View>
    </Screen>
  );
}
