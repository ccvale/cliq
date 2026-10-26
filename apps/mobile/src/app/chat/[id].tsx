import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ArrowLeft, ArrowUp, Ellipsis } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { MeshGradient } from '@/components/MeshGradient';
import { ProfileCard } from '@/components/ProfileCard';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Txt } from '@/components/Txt';
import { TypingDots } from '@/components/TypingDots';
import { api } from '@/lib/api';
import { realtime } from '@/lib/realtime';
import { clockTime, dayLabel } from '@/lib/time';
import type { Message } from '@/lib/types';
import { useMatches } from '@/state/matches';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { font, radius } from '@/theme/tokens';

type Item = { kind: 'msg'; m: Message; first: boolean; last: boolean } | { kind: 'day'; label: string; key: string };

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useSession();
  const { matches, markRead, remove, refresh } = useMatches();
  const { colors, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const match = matches.find((m) => m.id === id);
  const person = match?.person;

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<'unmatch' | 'block' | 'report' | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTypingSent = useRef(0);

  useEffect(() => {
    if (!match) void refresh();
    api
      .messages(id)
      .then((r) => {
        setMessages(r.messages);
        setHasMore(r.hasMore);
      })
      .catch((e) => setError(e.message));
    void api.markRead(id).then(() => markRead(id)).catch(() => {});

    return realtime.subscribe((event) => {
      if (event.type === 'message:new' && event.message.matchId === id) {
        setMessages((list) => (list?.some((m) => m.id === event.message.id) ? list : [...(list ?? []), event.message]));
        if (event.message.senderId !== me?.id) {
          setTyping(false);
          void api.markRead(id).then(() => markRead(id)).catch(() => {});
        }
      }
      if (event.type === 'message:read' && event.matchId === id) {
        setMessages((list) => list?.map((m) => (m.senderId === me?.id && !m.readAt ? { ...m, readAt: event.at } : m)) ?? list);
      }
      if (event.type === 'typing' && event.matchId === id) {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 4000);
      }
      if (event.type === 'match:ended' && event.matchId === id) router.back();
    });
  }, [id]);

  const loadOlder = async () => {
    if (!hasMore || !messages?.length) return;
    const r = await api.messages(id, messages[0]!.createdAt);
    setMessages((list) => [...r.messages, ...(list ?? [])]);
    setHasMore(r.hasMore);
  };

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      const sent = await api.send(id, body);
      setMessages((list) => (list?.some((m) => m.id === sent.id) ? list : [...(list ?? []), sent]));
    } catch (e: any) {
      setDraft(body);
      if (e.code === 'verify-email') router.push('/verify-email');
      else setError(e.message);
    }
  };

  const onType = (text: string) => {
    setDraft(text);
    if (Date.now() - lastTypingSent.current > 2500) {
      lastTypingSent.current = Date.now();
      realtime.send({ type: 'typing', matchId: id });
    }
  };

  // Newest first for the inverted list, with day separators and bubble grouping.
  const items = useMemo<Item[]>(() => {
    const list = messages ?? [];
    const out: Item[] = [];
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i]!;
      const newer = list[i + 1];
      const older = list[i - 1];
      const sameGroup = (a?: Message) => a && a.senderId === m.senderId && Math.abs(+new Date(a.createdAt) - +new Date(m.createdAt)) < 5 * 60_000;
      out.push({ kind: 'msg', m, first: !sameGroup(older), last: !sameGroup(newer) });
      if (!older || dayLabel(older.createdAt) !== dayLabel(m.createdAt)) out.push({ kind: 'day', label: dayLabel(m.createdAt), key: `day-${m.id}` });
    }
    return out;
  }, [messages]);

  const lastMine = messages?.filter((m) => m.senderId === me?.id).at(-1);

  const sendStyle = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(draft.trim() ? 1 : 0.85) }], opacity: withSpring(draft.trim() ? 1 : 0.5) }));

  return (
    <Screen edges={['top']} keyboard maxWidth={720} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={[styles.header, { borderBottomColor: colors.line }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
          <ArrowLeft size={24} color={colors.ink} />
        </Pressable>
        {person ? (
          <Pressable onPress={() => setShowProfile(true)} style={styles.who} accessibilityLabel={`View ${person.displayName}'s profile`}>
            <Avatar name={person.displayName} palette={person.palette} photo={person.photoUrl} size={40} />
            <View style={{ flex: 1 }}>
              <Txt variant="heading" numberOfLines={1}>
                {person.displayName}
              </Txt>
              <Txt variant="caption" tone={typing ? 'accent' : 'muted'} numberOfLines={1}>
                {typing ? 'typing…' : [person.gigTitle, person.distance].filter(Boolean).join(' · ')}
              </Txt>
            </View>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Pressable onPress={() => setMenu(true)} hitSlop={12} accessibilityLabel="More options">
          <Ellipsis size={24} color={colors.ink} />
        </Pressable>
      </View>

      {messages === null ? (
        <ActivityIndicator style={{ flex: 1 }} color={accent.solid} />
      ) : (
        <FlatList
          inverted
          data={items}
          keyExtractor={(it) => (it.kind === 'msg' ? it.m.id : it.key)}
          onEndReached={loadOlder}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyboardDismissMode="interactive"
          ListHeaderComponent={typing ? <Animated.View entering={FadeIn} style={{ marginTop: 6 }}><TypingDots /></Animated.View> : undefined}
          ListFooterComponent={
            person && !hasMore ? (
              <View style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
                <Avatar name={person.displayName} palette={person.palette} photo={person.photoUrl} size={72} />
                <Txt variant="title" center>
                  You and {person.displayName} clicked
                </Txt>
                {person.sharedInterests.length ? (
                  <Txt tone="muted" center style={{ maxWidth: 300 }}>
                    You’re both into {person.sharedInterests.join(', ').toLowerCase()}. That’s a great place to start.
                  </Txt>
                ) : null}
              </View>
            ) : undefined
          }
          renderItem={({ item }) => {
            if (item.kind === 'day') {
              return (
                <Txt variant="caption" tone="muted" center style={{ marginVertical: 14 }}>
                  {item.label}
                </Txt>
              );
            }
            const mine = item.m.senderId === me?.id;
            const bubble = [
              styles.bubble,
              mine && !item.last && { borderBottomRightRadius: 8 },
              mine && !item.first && { borderTopRightRadius: 8 },
              !mine && !item.last && { borderBottomLeftRadius: 8 },
              !mine && !item.first && { borderTopLeftRadius: 8 },
            ];
            return (
              <Animated.View entering={FadeInUp.duration(250)} style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginTop: item.first ? 10 : 3 }}>
                {mine ? (
                  <MeshGradient from={accent.from} to={accent.to} intensity={0.5} style={bubble}>
                    <Txt style={{ color: '#fff' }}>{item.m.body}</Txt>
                  </MeshGradient>
                ) : (
                  <View style={[bubble, { backgroundColor: colors.bgRaised }]}>
                    <Txt>{item.m.body}</Txt>
                  </View>
                )}
                {item.last ? (
                  <Txt variant="caption" tone="muted" style={{ marginTop: 4, marginHorizontal: 6 }}>
                    {clockTime(item.m.createdAt)}
                    {mine && item.m.id === lastMine?.id && item.m.readAt ? ' · Seen' : ''}
                  </Txt>
                ) : null}
              </Animated.View>
            );
          }}
        />
      )}

      {error ? (
        <Txt variant="caption" tone="danger" center style={{ paddingVertical: 4 }}>
          {error}
        </Txt>
      ) : null}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10), borderTopColor: colors.line }]}>
        <TextInput
          value={draft}
          onChangeText={onType}
          placeholder={person ? `Message ${person.displayName}` : 'Message'}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
          {...(Platform.OS === 'web' ? ({ rows: 1 } as object) : {})}
          onKeyPress={(e: any) => {
            // Enter sends on web; Shift+Enter adds a line.
            if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey && typeof document !== 'undefined') {
              e.preventDefault();
              void send();
            }
          }}
          style={[styles.input, { color: colors.ink, backgroundColor: colors.bgRaised, borderColor: colors.line }] as any}
        />
        <Animated.View style={sendStyle}>
          <Pressable onPress={send} disabled={!draft.trim()} accessibilityLabel="Send">
            <MeshGradient from={accent.from} to={accent.to} style={styles.send}>
              <ArrowUp size={20} color="#fff" strokeWidth={2.6} />
            </MeshGradient>
          </Pressable>
        </Animated.View>
      </View>

      <Sheet
        visible={menu}
        onClose={() => setMenu(false)}
        actions={[
          { label: 'View profile', onPress: () => setShowProfile(true) },
          { label: 'Unmatch', onPress: () => setConfirm('unmatch'), destructive: true },
          { label: 'Block', onPress: () => setConfirm('block'), destructive: true },
          { label: 'Report and block', onPress: () => setConfirm('report'), destructive: true },
        ]}
      />
      <Sheet
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        title={`${{ unmatch: 'Unmatch', block: 'Block', report: 'Report' }[confirm ?? 'unmatch']} ${person?.displayName}?`}
        message={
          confirm === 'report'
            ? 'They won’t be able to contact you or see you again, and we’ll review the conversation.'
            : confirm === 'block'
              ? 'They won’t be able to message you or see you in Discover. You can unblock them in Settings.'
              : 'This conversation will disappear for both of you.'
        }
        actions={[
          {
            label: { unmatch: 'Unmatch', block: 'Block', report: 'Report and block' }[confirm ?? 'unmatch'],
            destructive: true,
            onPress: async () => {
              try {
                if (confirm === 'report' && person) await api.report(person.id, 'Reported from chat');
                else if (confirm === 'block' && person) await api.block(person.id);
                else await api.unmatch(id);
                remove(id);
                router.back();
              } catch (e: any) {
                setError(e.message);
              }
            },
          },
        ]}
      />
      <Modal visible={showProfile} transparent animationType="fade" onRequestClose={() => setShowProfile(false)}>
        <Pressable style={styles.profileBackdrop} onPress={() => setShowProfile(false)}>
          {person ? <ProfileCard card={person} style={{ width: '100%', maxWidth: 380, aspectRatio: 0.7 }} /> : null}
          <Txt variant="caption" style={{ color: '#fff', marginTop: 16 }}>
            Tap anywhere to close
          </Txt>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bubble: { maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontFamily: font.body,
    fontSize: 16,
    outlineStyle: 'none',
  } as any,
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  profileBackdrop: { flex: 1, backgroundColor: 'rgba(8,7,10,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
});
