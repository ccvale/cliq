import { useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';
import { Fingerprint, KeyRound, LogOut } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Section } from '@/components/Section';
import { Sheet } from '@/components/Sheet';
import { Slider } from '@/components/Slider';
import { Txt } from '@/components/Txt';
import { api } from '@/lib/api';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const { me, setProfile, signOut, biometricLock, setBiometricLock } = useSession();
  const { colors, accent } = useTheme();
  const p = me!.profile;
  const teen = (p.age ?? 18) < 18;
  const bounds = teen ? [13, 17] : [18, 80];

  const [distance, setDistance] = useState(p.maxDistanceMi);
  const [ages, setAges] = useState([Math.max(p.ageMin, bounds[0]!), Math.min(p.ageMax, bounds[1]!)]);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [changing, setChanging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Save discovery preferences as soon as a slider settles.
  const savePrefs = async (patch: { maxDistanceMi?: number; ageMin?: number; ageMax?: number }) => {
    try {
      setProfile(await api.updateProfile(patch));
    } catch {}
  };

  const changePassword = async () => {
    setChanging(true);
    setPasswordMsg(null);
    try {
      await api.changePassword(me!.hasPassword ? current : undefined, next);
      setCurrent('');
      setNext('');
      setPasswordMsg({ ok: true, text: 'Password updated. Other devices were signed out.' });
    } catch (e: any) {
      setPasswordMsg({ ok: false, text: e.message });
    } finally {
      setChanging(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom']}>
      <ScreenHeader title="Settings" />

      <Section title="Discovery">
        <View style={styles.rowBetween}>
          <Txt variant="label">Maximum distance</Txt>
          <Txt variant="label" tone="accent">
            {distance >= 150 ? '150+ mi' : `${distance} mi`}
          </Txt>
        </View>
        <Slider
          min={1}
          max={150}
          value={[distance]}
          onChange={([d]) => {
            setDistance(d!);
            void savePrefs({ maxDistanceMi: d });
          }}
        />
        <View style={styles.rowBetween}>
          <Txt variant="label">Age range</Txt>
          <Txt variant="label" tone="accent">
            {ages[0]} – {ages[1]}
            {ages[1] === 80 ? '+' : ''}
          </Txt>
        </View>
        <Slider
          min={bounds[0]!}
          max={bounds[1]!}
          value={ages}
          onChange={(v) => {
            setAges(v);
            void savePrefs({ ageMin: v[0], ageMax: v[1] === 80 ? 120 : v[1] });
          }}
        />
        {teen ? (
          <Txt variant="caption" tone="muted">
            Because you’re under 18, you’ll only see people aged 13 to 17.
          </Txt>
        ) : null}
      </Section>

      <Section title="Privacy and security">
        {Platform.OS !== 'web' ? (
          <View style={styles.rowBetween}>
            <View style={styles.rowIcon}>
              <Fingerprint size={20} color={colors.ink} />
              <View>
                <Txt variant="label">Lock with Face ID</Txt>
                <Txt variant="caption" tone="muted">
                  Ask when Cliq opens after 30 seconds away
                </Txt>
              </View>
            </View>
            <Switch value={biometricLock} onValueChange={setBiometricLock} trackColor={{ true: accent.solid, false: colors.bgSunken }} />
          </View>
        ) : null}
        <View style={styles.rowIcon}>
          <KeyRound size={20} color={colors.ink} />
          <Txt variant="label">{me!.hasPassword ? 'Change password' : 'Add a password'}</Txt>
        </View>
        {me!.hasPassword ? (
          <Field value={current} onChangeText={setCurrent} secureTextEntry placeholder="Current password" autoComplete="current-password" />
        ) : null}
        <Field value={next} onChangeText={setNext} secureTextEntry placeholder="New password" autoComplete="new-password" hint="10+ characters with a number or symbol" />
        {passwordMsg ? (
          <Txt variant="caption" tone={passwordMsg.ok ? 'accent' : 'danger'}>
            {passwordMsg.text}
          </Txt>
        ) : null}
        <Button label="Update password" variant="secondary" size="md" onPress={changePassword} loading={changing} disabled={!next} />
      </Section>

      <Section title="Account" footer={me!.email ? `Signed in as ${me!.email}` : 'Signed in with Apple'}>
        <Button label="Sign out" variant="secondary" size="md" icon={<LogOut size={16} color={colors.ink} />} onPress={signOut} />
        <Button label="Delete account" variant="danger" size="md" onPress={() => setConfirmDelete(true)} />
      </Section>

      <Txt variant="caption" tone="muted" center style={{ marginVertical: 32 }}>
        Cliq 2.0 · made with care in New Jersey
      </Txt>

      <Sheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        message="Your profile, friends and messages are erased right away. This can’t be undone."
        actions={[
          {
            label: 'Delete everything',
            destructive: true,
            onPress: async () => {
              await api.deleteAccount().catch(() => {});
              await signOut();
            },
          },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowIcon: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
});
