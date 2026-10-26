import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { Globe, Smartphone } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Section } from '@/components/Section';
import { Txt } from '@/components/Txt';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/time';
import type { Device } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';

export default function Devices() {
  const { colors, accent } = useTheme();
  const [list, setList] = useState<Device[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.devices().then((r) => setList(r.sessions)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const signOut = async (id: string) => {
    try {
      await api.signOutDevice(id);
      setList((l) => l?.filter((d) => d.id !== id) ?? null);
    } catch (e: any) {
      setError(e.message);
    }
  };
  const others = list?.filter((d) => !d.current) ?? [];

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <ScreenHeader title="Where you’re signed in" />
      {list === null ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={accent.solid} />
      ) : (
        <Section title="Devices" footer="Signing a device out takes effect immediately. If you don’t recognise one, sign it out and change your password.">
          {list.map((d) => {
            const Icon = /app|iPhone|Android|iPad/.test(d.device) ? Smartphone : Globe;
            return (
              <Animated.View key={d.id} exiting={FadeOut} layout={LinearTransition} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon size={22} color={colors.ink} />
                <View style={{ flex: 1 }}>
                  <Txt variant="label">{d.device}</Txt>
                  <Txt variant="caption" tone={d.current ? 'accent' : 'muted'}>
                    {d.current ? 'This device' : `Active ${timeAgo(d.lastSeenAt)}`}
                  </Txt>
                </View>
                {d.current ? null : <Button label="Sign out" variant="secondary" size="md" onPress={() => signOut(d.id)} />}
              </Animated.View>
            );
          })}
          {others.length > 1 ? (
            <Button label="Sign out all other devices" variant="danger" size="md" onPress={() => others.forEach((d) => void signOut(d.id))} />
          ) : null}
        </Section>
      )}
      {error ? (
        <Txt variant="label" tone="danger" style={{ marginTop: 16 }}>
          {error}
        </Txt>
      ) : null}
    </Screen>
  );
}
