import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { BADGES } from '@/lib/catalog';
import { realtime } from '@/lib/realtime';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { MeshGradient } from './MeshGradient';
import { Txt } from './Txt';

/** Drops in from the top when a badge is earned, from anywhere in the app. Several in a row queue up. */
export function AchievementToast() {
  const { accent } = useTheme();
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const current = queue[0];

  useEffect(
    () =>
      realtime.subscribe((event) => {
        if (event.type === 'achievement:new' && BADGES[event.badge]) setQueue((q) => [...q, event.badge]);
      }),
    [],
  );

  useEffect(() => {
    if (!current) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    timer.current = setTimeout(() => setQueue((q) => q.slice(1)), 3500);
    return () => clearTimeout(timer.current);
  }, [current]);

  if (!current) return null;
  const badge = BADGES[current]!;
  return (
    <Animated.View key={current} entering={SlideInUp.springify().damping(16)} exiting={FadeOutUp} style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable
        onPress={() => {
          setQueue((q) => q.slice(1));
          router.push('/(tabs)/profile');
        }}
        accessibilityRole="alert"
        accessibilityLabel={`Badge earned: ${badge.name}`}
      >
        <MeshGradient from={accent.from} to={accent.to} style={styles.toast}>
          <View style={styles.emoji}>
            <Txt style={{ fontSize: 24 }}>{badge.emoji}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Badge earned
            </Txt>
            <Txt variant="heading" style={{ color: '#fff' }}>
              {badge.name}
            </Txt>
          </View>
        </MeshGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#17141B',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  emoji: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.25)' },
});
