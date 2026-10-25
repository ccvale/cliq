import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { MessageCircleHeart } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { MeshGradient } from '@/components/MeshGradient';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { shortAgo } from '@/lib/time';
import type { MatchSummary } from '@/lib/types';
import { useMatches } from '@/state/matches';
import { useTheme } from '@/theme/ThemeProvider';
import { WIDE } from '@/theme/tokens';

const open = (id: string) => router.push({ pathname: '/chat/[id]', params: { id } });

function NewFriend({ m, index }: { m: MatchSummary; index: number }) {
  const { accent } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(index * 60)}>
      <Pressable onPress={() => open(m.id)} style={{ alignItems: 'center', gap: 8, width: 76 }} accessibilityLabel={`Say hi to ${m.person.displayName}`}>
        <Avatar name={m.person.displayName} palette={m.person.palette} size={64} ring={accent.solid} />
        <Txt variant="label" numberOfLines={1}>
          {m.person.displayName}
        </Txt>
      </Pressable>
    </Animated.View>
  );
}

function Row({ m }: { m: MatchSummary }) {
  const { colors, accent } = useTheme();
  const unread = m.unread > 0;
  return (
    <Pressable
      onPress={() => open(m.id)}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.bgSunken : 'transparent' }]}
      accessibilityLabel={`${m.person.displayName}${unread ? `, ${m.unread} unread` : ''}`}
    >
      <Avatar name={m.person.displayName} palette={m.person.palette} size={56} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Txt variant="heading" numberOfLines={1} style={{ flexShrink: 1 }}>
            {m.person.displayName}
          </Txt>
          <Txt variant="caption" tone={unread ? 'accent' : 'muted'}>
            {shortAgo(m.lastMessage!.at)}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt numberOfLines={1} tone={unread ? 'ink' : 'muted'} style={{ flex: 1, fontSize: 15 }}>
            {m.lastMessage!.fromMe ? 'You: ' : ''}
            {m.lastMessage!.body}
          </Txt>
          {unread ? <View style={[styles.dot, { backgroundColor: accent.to }]} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function Chats() {
  const { matches, loading, refresh } = useMatches();
  const { accent, colors } = useTheme();
  const { width } = useWindowDimensions();
  const fresh = matches.filter((m) => !m.lastMessage);
  const talking = matches.filter((m) => m.lastMessage);

  return (
    <Screen maxWidth={640}>
      <View style={{ paddingTop: 12, paddingBottom: 8 }}>
        <Txt variant="display">Friends</Txt>
      </View>
      {!loading && matches.length === 0 ? (
        <EmptyState
          art={
            <MeshGradient from={accent.from} to={accent.to} style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircleHeart color="#fff" size={38} />
            </MeshGradient>
          }
          title="No friends yet"
          body="When you and someone both say yes, they’ll show up here and you can start talking."
          action={<Button label="Start discovering" variant="accent" onPress={() => router.navigate('/')} />}
        />
      ) : (
        <FlatList
          data={talking}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <Animated.View layout={LinearTransition.springify().damping(18)}>
              <Row m={item} />
            </Animated.View>
          )}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={accent.solid} />}
          contentContainerStyle={{ paddingBottom: width >= WIDE ? 24 : 120 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ gap: 14, marginBottom: 8 }}>
              {fresh.length ? (
                <>
                  <Txt variant="eyebrow" tone="muted" style={{ marginTop: 12 }}>
                    New friends · say hi
                  </Txt>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                    {fresh.map((m, i) => (
                      <NewFriend key={m.id} m={m} index={i} />
                    ))}
                  </ScrollView>
                </>
              ) : null}
              {talking.length ? (
                <Txt variant="eyebrow" tone="muted" style={{ marginTop: 16 }}>
                  Conversations
                </Txt>
              ) : null}
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 84 }} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 8, marginHorizontal: -8, borderRadius: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
