import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MailCheck } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { MeshGradient } from '@/components/MeshGradient';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Txt } from '@/components/Txt';
import { api, DEMO } from '@/lib/api';
import { DEMO_CODE } from '@/lib/demo';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';

const RESEND_SECONDS = 45;

export default function VerifyEmail() {
  const { me, reload } = useSession();
  const { accent } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async (value = code) => {
    if (value.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await api.verifyEmail(value);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await reload();
      router.back();
    } catch (e: any) {
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e.message);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setNote(null);
    try {
      await api.sendVerification();
      setNote('Sent. It can take a minute to arrive.');
      setWait(RESEND_SECONDS);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom']} maxWidth={460}>
      <ScreenHeader title="" close />
      <View style={{ alignItems: 'center', gap: 14, marginTop: 24, marginBottom: 32 }}>
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <MeshGradient from={accent.from} to={accent.to} style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }}>
            <MailCheck color="#fff" size={34} />
          </MeshGradient>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ gap: 8, alignItems: 'center' }}>
          <Txt variant="display" center>
            Check your inbox
          </Txt>
          <Txt tone="muted" center style={{ maxWidth: 340 }}>
            We sent a 6-digit code to <Txt tone="ink">{me?.email}</Txt>. Confirming keeps Cliq free of fake accounts.
          </Txt>
          {DEMO ? (
            <Txt variant="caption" tone="accent" center>
              Demo: there’s no email here, so use {DEMO_CODE}.
            </Txt>
          ) : null}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ gap: 18 }}>
        <CodeInput value={code} onChange={setCode} onComplete={verify} error={!!error} />
        {error ? (
          <Txt variant="label" tone="danger" center>
            {error}
          </Txt>
        ) : note ? (
          <Txt variant="label" tone="muted" center>
            {note}
          </Txt>
        ) : null}
        <Button label="Confirm email" variant="accent" onPress={() => verify()} loading={busy} disabled={code.length !== 6} />
        <Button
          label={wait > 0 ? `Resend code in ${wait}s` : 'Send a new code'}
          variant="ghost"
          size="md"
          disabled={wait > 0}
          onPress={resend}
        />
      </Animated.View>
    </Screen>
  );
}
