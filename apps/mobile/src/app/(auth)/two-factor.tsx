import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { Field } from '@/components/Field';
import { MeshGradient } from '@/components/MeshGradient';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { api, DEMO } from '@/lib/api';
import { DEMO_CODE } from '@/lib/demo';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';

/** Second step of signing in when two-step verification is on. */
export default function TwoFactor() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { completeSignIn } = useSession();
  const { colors, accent } = useTheme();
  const [code, setCode] = useState('');
  const [backup, setBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (value = code) => {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await completeSignIn(await api.verifyTwoFactor(token ?? '', value.trim()));
    } catch (e: any) {
      setError(e.message);
      if (!backup) setCode('');
      if (e.status === 401) setTimeout(() => router.back(), 1500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom']} maxWidth={460}>
      <Pressable onPress={() => router.back()} hitSlop={16} style={{ paddingVertical: 16, alignSelf: 'flex-start' }} accessibilityLabel="Back">
        <ArrowLeft size={24} color={colors.ink} />
      </Pressable>
      <View style={{ alignItems: 'center', gap: 14, marginTop: 12, marginBottom: 28 }}>
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <MeshGradient from={accent.from} to={accent.to} style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck color="#fff" size={36} />
          </MeshGradient>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ gap: 8, alignItems: 'center' }}>
          <Txt variant="display" center>
            Two-step verification
          </Txt>
          <Txt tone="muted" center style={{ maxWidth: 340 }}>
            {backup ? 'Enter one of the backup codes you saved when you turned this on.' : 'Open your authenticator app and enter the 6-digit code for Cliq.'}
          </Txt>
          {DEMO ? (
            <Txt variant="caption" tone="accent" center>
              Demo: use {DEMO_CODE}.
            </Txt>
          ) : null}
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ gap: 18 }}>
        {backup ? (
          <Field value={code} onChangeText={setCode} placeholder="xxxx-xxxx" autoCapitalize="none" autoCorrect={false} autoFocus onSubmitEditing={() => submit()} />
        ) : (
          <CodeInput value={code} onChange={setCode} onComplete={submit} error={!!error} />
        )}
        {error ? (
          <Txt variant="label" tone="danger" center>
            {error}
          </Txt>
        ) : null}
        <Button label="Continue" variant="accent" onPress={() => submit()} loading={busy} disabled={backup ? code.trim().length < 8 : code.length !== 6} />
        <Button
          label={backup ? 'Use my authenticator app' : 'Use a backup code'}
          variant="ghost"
          size="md"
          onPress={() => {
            setBackup((b) => !b);
            setCode('');
            setError(null);
          }}
        />
      </Animated.View>
    </Screen>
  );
}
