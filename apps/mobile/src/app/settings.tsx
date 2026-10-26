import { useState } from 'react';
import { Platform, Share, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, CircleDot, Download, Fingerprint, KeyRound, LocateFixed, LogOut, MessageCircle, MonitorSmartphone, Moon, ShieldCheck, ShieldOff } from 'lucide-react-native';
import { LinkRow } from '@/components/LinkRow';
import { Segmented } from '@/components/Segmented';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Section } from '@/components/Section';
import { Slider } from '@/components/Slider';
import { Txt } from '@/components/Txt';
import { api } from '@/lib/api';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const { me, setProfile, signOut, biometricLock, setBiometricLock, reload } = useSession();
  const { colors, accent, appearance, setAppearance } = useTheme();
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
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [settings, setSettings] = useState(me!.settings);
  const snoozed = settings.snoozedUntil && new Date(settings.snoozedUntil) > new Date();
  const snoozeChoice = !snoozed ? 'off' : new Date(settings.snoozedUntil!).getTime() - Date.now() > 400 * 86_400_000 ? 'off-forever' : 'on';
  const [snoozePick, setSnoozePick] = useState<'0' | '1' | '7' | '3650'>(snoozeChoice === 'off' ? '0' : snoozeChoice === 'off-forever' ? '3650' : '7');

  const saveSettings = async (patch: { notifyMatches?: boolean; notifyMessages?: boolean; liveLocation?: boolean; showActivity?: boolean; snoozeDays?: number }) => {
    const before = settings;
    if (patch.snoozeDays === undefined) setSettings((s) => ({ ...s, ...patch }));
    try {
      await api.updateSettings(patch);
      if (patch.snoozeDays !== undefined) {
        setSettings((s) => ({ ...s, snoozedUntil: patch.snoozeDays ? new Date(Date.now() + patch.snoozeDays * 86_400_000).toISOString() : null }));
      }
      void reload();
    } catch {
      setSettings(before);
    }
  };

  const exportData = async () => {
    const json = JSON.stringify(await api.exportData(), null, 2);
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cliq-data.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      await Share.share({ title: 'My Cliq data', message: json });
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAccount(me!.hasPassword ? deletePassword : undefined);
      await signOut();
    } catch (e: any) {
      setDeleteError(e.message);
      setDeleting(false);
    }
  };

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

      <Section
        title="Take a break"
        footer={
          snoozed
            ? snoozePick === '3650'
              ? 'You’re hidden from Discover until you turn this off. Your friends and chats stay as they are.'
              : `You’re hidden from Discover until ${new Date(settings.snoozedUntil!).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}. Your friends and chats stay as they are.`
            : 'Hide your card from Discover for a while. Your friends and chats stay as they are.'
        }
      >
        <Segmented
          value={snoozePick}
          onChange={(v) => {
            setSnoozePick(v);
            void saveSettings({ snoozeDays: Number(v) });
          }}
          options={[
            { value: '0', label: 'Visible' },
            { value: '1', label: '1 day' },
            { value: '7', label: '1 week' },
            { value: '3650', label: 'Paused' },
          ]}
        />
      </Section>

      <Section title="Notifications">
        <View style={styles.rowBetween}>
          <View style={styles.rowIcon}>
            <Bell size={20} color={colors.ink} />
            <Txt variant="label">New friends</Txt>
          </View>
          <Switch value={settings.notifyMatches} onValueChange={(v) => saveSettings({ notifyMatches: v })} trackColor={{ true: accent.solid, false: colors.bgSunken }} />
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.rowIcon}>
            <MessageCircle size={20} color={colors.ink} />
            <Txt variant="label">Messages</Txt>
          </View>
          <Switch value={settings.notifyMessages} onValueChange={(v) => saveSettings({ notifyMessages: v })} trackColor={{ true: accent.solid, false: colors.bgSunken }} />
        </View>
      </Section>

      <Section title="Appearance">
        <View style={styles.rowIcon}>
          <Moon size={20} color={colors.ink} />
          <Txt variant="label">Theme</Txt>
        </View>
        <Segmented
          value={appearance}
          onChange={setAppearance}
          options={[
            { value: 'system', label: 'Automatic' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Section>

      <Section title="Privacy and security">
        <View style={styles.rowBetween}>
          <View style={styles.rowIcon}>
            <CircleDot size={20} color={colors.ink} />
            <View style={{ flexShrink: 1 }}>
              <Txt variant="label">Show when I’m active</Txt>
              <Txt variant="caption" tone="muted">
                Friends see “Online now” or when you were last on
              </Txt>
            </View>
          </View>
          <Switch value={settings.showActivity} onValueChange={(v) => saveSettings({ showActivity: v })} trackColor={{ true: accent.solid, false: colors.bgSunken }} />
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.rowIcon}>
            <LocateFixed size={20} color={colors.ink} />
            <View style={{ flexShrink: 1 }}>
              <Txt variant="label">Use where I am now</Txt>
              <Txt variant="caption" tone="muted">
                Distances follow you when you open Cliq. Off keeps your home spot
              </Txt>
            </View>
          </View>
          <Switch value={settings.liveLocation} onValueChange={(v) => saveSettings({ liveLocation: v })} trackColor={{ true: accent.solid, false: colors.bgSunken }} />
        </View>
        <LinkRow
          icon={<ShieldCheck size={20} color={colors.ink} />}
          label="Two-step verification"
          detail={me!.twoFactorEnabled ? 'On' : 'Off · add a code from an authenticator app'}
          onPress={() => router.push('/two-factor-setup')}
        />
        <LinkRow icon={<MonitorSmartphone size={20} color={colors.ink} />} label="Where you’re signed in" detail="See devices and sign them out" onPress={() => router.push('/devices')} />
        <LinkRow icon={<ShieldOff size={20} color={colors.ink} />} label="Blocked people" onPress={() => router.push('/blocked')} />
        <LinkRow icon={<Download size={20} color={colors.ink} />} label="Download my data" detail="Everything Cliq stores about you, as a file" onPress={() => void exportData()} />
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
        {confirmDelete ? (
          <View style={{ gap: 12 }}>
            <Txt variant="label">Delete your account?</Txt>
            <Txt variant="caption" tone="muted">
              Your profile, friends and messages are erased right away. This can’t be undone.
            </Txt>
            {me!.hasPassword ? (
              <Field value={deletePassword} onChangeText={setDeletePassword} secureTextEntry placeholder="Enter your password to confirm" autoComplete="current-password" />
            ) : null}
            {deleteError ? (
              <Txt variant="caption" tone="danger">
                {deleteError}
              </Txt>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Keep it" variant="secondary" size="md" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} />
              <Button
                label="Delete forever"
                variant="danger"
                size="md"
                loading={deleting}
                disabled={me!.hasPassword && !deletePassword}
                onPress={deleteAccount}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <Button label="Delete account" variant="danger" size="md" onPress={() => setConfirmDelete(true)} />
        )}
      </Section>

      <Txt variant="caption" tone="muted" center style={{ marginVertical: 32 }}>
        Cliq 2.0 · made with care in New Jersey
      </Txt>

    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowIcon: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
});
