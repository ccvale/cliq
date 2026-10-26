import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Copy, ExternalLink, ShieldCheck } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Section } from '@/components/Section';
import { Txt } from '@/components/Txt';
import { api, DEMO } from '@/lib/api';
import { DEMO_CODE } from '@/lib/demo';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { font, radius } from '@/theme/tokens';

type Step = 'intro' | 'scan' | 'codes';

export default function TwoFactorSetup() {
  const { me, reload } = useSession();
  const { colors, accent } = useTheme();
  const [step, setStep] = useState<Step>('intro');
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const copy = async (text: string, what: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1800);
  };

  const start = () =>
    run(async () => {
      setSetup(await api.twoFactorSetup());
      setStep('scan');
    });
  const enable = (value = code) =>
    run(async () => {
      try {
        const { backupCodes } = await api.twoFactorEnable(value);
        setCodes(backupCodes);
        setStep('codes');
        await reload();
      } catch (e) {
        setCode('');
        throw e;
      }
    });
  const disable = () =>
    run(async () => {
      await api.twoFactorDisable(code.trim());
      setCode('');
      await reload();
      router.back();
    });

  const demoHint = DEMO ? (
    <Txt variant="caption" tone="accent">
      Demo: use {DEMO_CODE} as the code.
    </Txt>
  ) : null;
  const errorLine = error ? (
    <Txt variant="label" tone="danger">
      {error}
    </Txt>
  ) : null;

  // Already on: show status and a way to turn it off.
  if (me?.twoFactorEnabled && step !== 'codes') {
    return (
      <Screen scroll keyboard edges={['top', 'bottom']}>
        <ScreenHeader title="Two-step verification" />
        <Section title="Status" footer="Lost your phone? Sign in with one of your backup codes, then turn this off and on again to link the new phone.">
          <View style={styles.row}>
            <ShieldCheck size={22} color={accent.solid} />
            <Txt variant="label">On. Signing in asks for a code from your authenticator app.</Txt>
          </View>
        </Section>
        <Section title="Turn off">
          <Field value={code} onChangeText={setCode} placeholder="Authenticator or backup code" autoCapitalize="none" autoCorrect={false} />
          {demoHint}
          {errorLine}
          <Button label="Turn off two-step verification" variant="danger" size="md" onPress={disable} loading={busy} disabled={code.trim().length < 6} />
        </Section>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboard edges={['top', 'bottom']}>
      <ScreenHeader title="Two-step verification" />

      {step === 'intro' ? (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Section title="Extra protection" footer="Works with Google Authenticator, Microsoft Authenticator, 1Password, Authy and others.">
            <View style={styles.row}>
              <ShieldCheck size={22} color={accent.solid} />
              <Txt style={{ flex: 1 }}>
                After your password or email code, Cliq will also ask for a 6-digit code from an authenticator app on your phone. Someone who learns your password still can’t get in.
              </Txt>
            </View>
            {errorLine}
            <Button label="Set it up" variant="accent" onPress={start} loading={busy} />
          </Section>
        </Animated.View>
      ) : null}

      {step === 'scan' && setup ? (
        <Animated.View entering={FadeInRight.duration(400)}>
          <Section title="1 · Add Cliq to your authenticator">
            {Platform.OS === 'web' ? (
              <View style={[styles.qr, { borderColor: colors.line }]}>
                <QRCode value={setup.uri} size={190} color={colors.ink} backgroundColor={colors.bgRaised} />
              </View>
            ) : (
              <Button
                label="Open in authenticator app"
                variant="secondary"
                size="md"
                icon={<ExternalLink size={16} color={colors.ink} />}
                onPress={() => Linking.openURL(setup.uri).catch(() => setError('No authenticator app found. Copy the key below instead.'))}
              />
            )}
            <Txt variant="caption" tone="muted">
              {Platform.OS === 'web' ? 'Scan with your authenticator app, or type this key into it:' : 'Or add it by hand with this key:'}
            </Txt>
            <Pressable onPress={() => copy(setup.secret, 'key')} style={[styles.secret, { backgroundColor: colors.bgSunken }]} accessibilityLabel="Copy key">
              <Txt style={styles.mono} selectable>
                {setup.secret.match(/.{1,4}/g)?.join(' ')}
              </Txt>
              <Copy size={16} color={colors.muted} />
            </Pressable>
            {copied === 'key' ? (
              <Txt variant="caption" tone="accent">
                Copied
              </Txt>
            ) : null}
          </Section>
          <Section title="2 · Enter the code it shows">
            <CodeInput value={code} onChange={setCode} onComplete={enable} error={!!error} />
            {demoHint}
            {errorLine}
            <Button label="Turn on" variant="accent" onPress={() => enable()} loading={busy} disabled={code.length !== 6} />
          </Section>
        </Animated.View>
      ) : null}

      {step === 'codes' ? (
        <Animated.View entering={FadeInRight.duration(400)}>
          <Section title="Save your backup codes" footer="Each code works once. Keep them somewhere safe, like a password manager. You won’t see them again.">
            <View style={styles.codes}>
              {codes.map((c) => (
                <Txt key={c} style={[styles.mono, styles.code]} selectable>
                  {c}
                </Txt>
              ))}
            </View>
            <Button
              label={copied === 'codes' ? 'Copied' : 'Copy all codes'}
              variant="secondary"
              size="md"
              icon={<Copy size={16} color={colors.ink} />}
              onPress={() => copy(codes.join('\n'), 'codes')}
            />
            <Button label="I’ve saved them" variant="accent" onPress={() => router.back()} />
          </Section>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qr: { alignSelf: 'center', padding: 14, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  secret: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 14, borderRadius: radius.md },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' }), fontSize: 15, letterSpacing: 1, flexShrink: 1 },
  codes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  code: { width: '46%', paddingVertical: 6 },
});
