import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { ShieldCheck } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Section } from '@/components/Section';
import { Txt } from '@/components/Txt';
import { api } from '@/lib/api';
import type { BlockedPerson } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';

export default function Blocked() {
  const { accent } = useTheme();
  const [list, setList] = useState<BlockedPerson[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.blocked().then((r) => setList(r.blocks)).catch((e) => setError(e.message));
  }, []);

  const unblock = async (id: string) => {
    try {
      await api.unblock(id);
      setList((l) => l?.filter((b) => b.id !== id) ?? null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <ScreenHeader title="Blocked people" />
      {list === null ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={accent.solid} />
      ) : list.length === 0 ? (
        <EmptyState art={<ShieldCheck size={44} color={accent.solid} />} title="No one is blocked" body="When you block someone from a chat, they show up here. They can’t see you or message you." />
      ) : (
        <Section title={`${list.length} blocked`} footer="Unblocking lets you see each other in Discover again. Past chats don’t come back.">
          {list.map((b) => (
            <Animated.View key={b.id} exiting={FadeOut} layout={LinearTransition} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={b.displayName} palette={b.palette} photo={b.photoUrl} size={44} />
              <View style={{ flex: 1 }}>
                <Txt variant="label">{b.displayName}</Txt>
                <Txt variant="caption" tone="muted">
                  Blocked {new Date(b.blockedAt).toLocaleDateString()}
                </Txt>
              </View>
              <Button label="Unblock" variant="secondary" size="md" onPress={() => unblock(b.id)} />
            </Animated.View>
          ))}
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
