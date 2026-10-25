import { forwardRef, useImperativeHandle, useLayoutEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { Card } from '@/lib/types';
import { font, radius } from '@/theme/tokens';
import { ProfileCard } from './ProfileCard';
import { Txt } from './Txt';

export type DeckHandle = { swipe: (liked: boolean) => void };

type Props = {
  cards: Card[];
  width: number;
  height: number;
  onSwiped: (card: Card, liked: boolean) => void;
  onEmpty?: () => void;
};

const haptic = (kind: 'tick' | 'commit') => {
  if (Platform.OS === 'web') return;
  if (kind === 'tick') void Haptics.selectionAsync();
  else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const SwipeDeck = forwardRef<DeckHandle, Props>(function SwipeDeck({ cards, width, height, onSwiped }, ref) {
  const [index, setIndex] = useState(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const armed = useSharedValue(0);
  const threshold = width * 0.32;
  const top = cards[index];

  // A new top card always starts centered.
  useLayoutEffect(() => {
    x.value = 0;
    y.value = 0;
    armed.value = 0;
  }, [index]);

  useLayoutEffect(() => setIndex(0), [cards]);

  const commit = (liked: boolean) => {
    const card = cards[index];
    if (!card) return;
    haptic('commit');
    setIndex((i) => i + 1);
    onSwiped(card, liked);
  };

  const flyOut = (liked: boolean, velocityX = 0) => {
    'worklet';
    const dir = liked ? 1 : -1;
    x.value = withTiming(dir * width * 1.6, { duration: Math.max(180, 320 - Math.abs(velocityX) / 20) }, (done) => {
      if (done) scheduleOnRN(commit, liked);
    });
    y.value = withTiming(y.value + 40, { duration: 300 });
  };

  useImperativeHandle(ref, () => ({ swipe: (liked) => top && flyOut(liked) }), [top, index]);

  const pan = usePanGesture({
    activeOffsetX: [-8, 8],
    onUpdate: (e) => {
      'worklet';
      x.value = e.translationX;
      y.value = e.translationY * 0.4;
      const over = Math.abs(e.translationX) > threshold ? 1 : 0;
      if (over !== armed.value) {
        armed.value = over;
        if (over) scheduleOnRN(haptic, 'tick');
      }
    },
    onDeactivate: (e) => {
      'worklet';
      const fling = Math.abs(e.velocityX) > 900;
      if (Math.abs(e.translationX) > threshold || fling) {
        flyOut((fling ? e.velocityX : e.translationX) > 0, e.velocityX);
      } else {
        x.value = withSpring(0, { damping: 16, stiffness: 180 });
        y.value = withSpring(0, { damping: 16, stiffness: 180 });
      }
    },
  });

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${interpolate(x.value, [-width, 0, width], [-12, 0, 12])}deg` },
    ],
  }));
  const nextStyle = useAnimatedStyle(() => {
    const p = Math.min(1, Math.abs(x.value) / threshold);
    return { transform: [{ translateY: 30 - 30 * p }, { scale: 0.94 + 0.06 * p }], opacity: 0.75 + 0.25 * p };
  });
  const likeStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [20, threshold], [0, 1], Extrapolation.CLAMP),
    transform: [{ rotate: '-8deg' }, { scale: interpolate(x.value, [0, threshold], [0.8, 1], Extrapolation.CLAMP) }],
  }));
  const passStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-threshold, -20], [1, 0], Extrapolation.CLAMP),
    transform: [{ rotate: '8deg' }, { scale: interpolate(x.value, [-threshold, 0], [1, 0.8], Extrapolation.CLAMP) }],
  }));

  const visible = cards.slice(index, index + 3);

  return (
    <View style={{ width, height }}>
      {visible
        .map((card, i) => {
          const size = { width, height, position: 'absolute' as const };
          if (i === 0) {
            return (
              <GestureDetector key={card.id} gesture={pan}>
                <Animated.View style={[size, topStyle]}>
                  <ProfileCard card={card} style={{ flex: 1 }} />
                  <Animated.View style={[styles.stamp, styles.likeStamp, likeStamp]} pointerEvents="none">
                    <Txt style={styles.stampText}>Let’s hang ✦</Txt>
                  </Animated.View>
                  <Animated.View style={[styles.stamp, styles.passStamp, passStamp]} pointerEvents="none">
                    <Txt style={[styles.stampText, { color: '#17141B' }]}>Not now</Txt>
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            );
          }
          return (
            <Animated.View
              key={card.id}
              pointerEvents="none"
              style={[size, i === 1 ? nextStyle : { transform: [{ translateY: 56 }, { scale: 0.88 }], opacity: 0.4 }]}
            >
              <ProfileCard card={card} style={{ flex: 1 }} compact />
            </Animated.View>
          );
        })
        .reverse()}
    </View>
  );
});

const styles = StyleSheet.create({
  stamp: {
    position: 'absolute',
    top: 72,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  likeStamp: { left: 20, backgroundColor: '#17141B' },
  passStamp: { right: 20, backgroundColor: 'rgba(255,255,255,0.95)' },
  stampText: { fontFamily: font.display, fontSize: 22, color: '#FFFFFF' },
});
