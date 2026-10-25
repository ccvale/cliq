import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SlidersHorizontal, Sparkles, X } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { MeshGradient } from '@/components/MeshGradient';
import { Screen } from '@/components/Screen';
import { SwipeDeck, type DeckHandle } from '@/components/SwipeDeck';
import { Txt } from '@/components/Txt';
import { Wordmark } from '@/components/Wordmark';
import { VerifyBanner } from '@/components/VerifyBanner';
import { api } from '@/lib/api';
import type { Card } from '@/lib/types';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { WIDE } from '@/theme/tokens';

const ACTIONS_HEIGHT = 140;

export default function Discover() {
  const { colors, accent } = useTheme();
  const { me } = useSession();
  const { width: windowWidth } = useWindowDimensions();
  const deck = useRef<DeckHandle>(null);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  // Session stats, a nod to the original Cliq dashboard.
  const [stats, setStats] = useState({ yes: 0, no: 0 });

  const load = useCallback(async () => {
    setError(null);
    try {
      const { cards } = await api.discover();
      setCards(cards);
      setRemaining(cards.length);
    } catch (e: any) {
      setError(e.message);
      setCards([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, me?.profile.maxDistanceMi, me?.profile.ageMin, me?.profile.ageMax]);

  const onSwiped = async (card: Card, liked: boolean) => {
    setStats((s) => (liked ? { ...s, yes: s.yes + 1 } : { ...s, no: s.no + 1 }));
    setRemaining((r) => r - 1);
    try {
      const { matchId } = await api.swipe(card.id, liked);
      if (matchId) {
        router.push({ pathname: '/match/[id]', params: { id: matchId, name: card.displayName, palette: card.palette.join(','), photo: card.photoUrl ?? '' } });
      }
    } catch (e: any) {
      if (e.code === 'verify-email') {
        // Put the card back and ask for the code. The swipe didn't count.
        setStats((s) => (liked ? { ...s, yes: s.yes - 1 } : { ...s, no: s.no - 1 }));
        router.push('/verify-email');
        void load();
      } else {
        setError(e.message);
      }
    }
  };

  const onLayout = (e: LayoutChangeEvent) => setArea(e.nativeEvent.layout);
  const cardWidth = Math.min(area.width, 420);
  const cardHeight = Math.max(0, Math.min(area.height - ACTIONS_HEIGHT, cardWidth * 1.42));
  const total = stats.yes + stats.no;
  const tabBarSpace = windowWidth >= WIDE ? 24 : 96;

  return (
    <Screen maxWidth={640}>
      <View style={styles.header}>
        {windowWidth >= WIDE ? <Txt variant="display">Discover</Txt> : <Wordmark />}
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          accessibilityLabel="Discovery settings"
          style={[styles.iconButton, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}
        >
          <SlidersHorizontal size={18} color={colors.ink} />
        </Pressable>
      </View>

      <VerifyBanner />
      <View style={{ flex: 1, alignItems: 'center', paddingBottom: tabBarSpace }} onLayout={onLayout}>
        {cards === null ? (
          <ActivityIndicator style={{ flex: 1 }} color={accent.solid} />
        ) : remaining <= 0 ? (
          <EmptyState
            art={
              <MeshGradient from={accent.from} to={accent.to} style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles color="#fff" size={36} />
              </MeshGradient>
            }
            title={total ? 'That’s everyone for now' : 'No one nearby yet'}
            body={
              error ??
              `You’ve seen everyone within ${me?.profile.maxDistanceMi} miles. Widen your radius or check back soon as new people join.`
            }
            action={
              <View style={{ gap: 10 }}>
                <Button label="Widen my search" variant="accent" onPress={() => router.push('/settings')} />
                <Button label="Refresh" variant="ghost" onPress={load} />
              </View>
            }
          />
        ) : cardHeight > 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center' }}>
            <SwipeDeck ref={deck} cards={cards} width={cardWidth} height={cardHeight} onSwiped={onSwiped} />
            <Animated.View entering={FadeInDown.delay(200)} style={styles.actions}>
              <Pressable
                onPress={() => deck.current?.swipe(false)}
                accessibilityLabel="Not now"
                style={({ pressed }) => [
                  styles.round,
                  { width: 64, height: 64, backgroundColor: colors.bgRaised, borderColor: colors.line, transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
              >
                <X size={26} color={colors.inkSoft} strokeWidth={2.4} />
              </Pressable>
              <Txt variant="caption" tone="muted" style={{ width: 92, textAlign: 'center' }}>
                {total ? `${total} seen · ${Math.round((stats.yes / total) * 100)}% yes` : 'Swipe or tap'}
              </Txt>
              <Pressable
                onPress={() => deck.current?.swipe(true)}
                accessibilityLabel="Let’s hang out"
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
              >
                <MeshGradient from={accent.from} to={accent.to} style={[styles.round, { width: 76, height: 76, borderWidth: 0 }]}>
                  <Sparkles size={30} color="#fff" strokeWidth={2.2} />
                </MeshGradient>
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, height: ACTIONS_HEIGHT, paddingTop: 36 },
  round: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});
