import { useState } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, usePanGesture, useTapGesture, useSimultaneousGestures } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  min: number;
  max: number;
  /** One value for a single thumb, two for a range. */
  value: number[];
  onChange: (value: number[]) => void;
  step?: number;
};

const THUMB = 28;

/** Single or two-thumb slider built on the gesture handler, so it feels native on phones and works with a mouse on web. */
export function Slider({ min, max, value, onChange, step = 1 }: Props) {
  const { colors, accent } = useTheme();
  const [width, setWidth] = useState(0);
  const track = Math.max(1, width - THUMB);
  const toX = (v: number) => ((v - min) / (max - min)) * track;
  const a = useSharedValue(toX(value[0]!));
  const b = useSharedValue(toX(value[1] ?? value[0]!));
  const active = useSharedValue<0 | 1>(0);
  const range = value.length === 2;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    const t = Math.max(1, w - THUMB);
    a.value = ((value[0]! - min) / (max - min)) * t;
    b.value = (((value[1] ?? value[0]!) - min) / (max - min)) * t;
  };

  const emit = (ax: number, bx: number) => {
    const snap = (px: number) => Math.round((min + (px / track) * (max - min)) / step) * step;
    const next = range ? [snap(ax), snap(bx)] : [snap(ax)];
    if (next.some((n, i) => n !== value[i])) {
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      onChange(next);
    }
  };

  const moveTo = (px: number, pick: boolean) => {
    'worklet';
    const clamped = Math.min(track, Math.max(0, px - THUMB / 2));
    if (pick) active.value = range && Math.abs(clamped - b.value) < Math.abs(clamped - a.value) ? 1 : 0;
    if (active.value === 1) b.value = Math.max(clamped, a.value);
    else a.value = range ? Math.min(clamped, b.value) : clamped;
    scheduleOnRN(emit, a.value, b.value);
  };

  const pan = usePanGesture({
    minDistance: 0,
    onBegin: (e) => {
      'worklet';
      moveTo(e.x, true);
    },
    onUpdate: (e) => {
      'worklet';
      moveTo(e.x, false);
    },
  });
  const tap = useTapGesture({
    onDeactivate: (e) => {
      'worklet';
      moveTo(e.x, true);
    },
  });
  const gesture = useSimultaneousGestures(pan, tap);

  const fill = useAnimatedStyle(() => ({
    left: (range ? a.value : 0) + THUMB / 2,
    width: (range ? b.value - a.value : a.value) + (range ? 0 : 0),
  }));
  const thumbA = useAnimatedStyle(() => ({ transform: [{ translateX: a.value }, { scale: withSpring(1) }] }));
  const thumbB = useAnimatedStyle(() => ({ transform: [{ translateX: b.value }] }));

  return (
    <GestureDetector gesture={gesture}>
      <View onLayout={onLayout} style={styles.hit} accessibilityRole="adjustable">
        <View style={[styles.track, { backgroundColor: colors.bgSunken }]} />
        <Animated.View style={[styles.fill, { backgroundColor: accent.solid }, fill]} />
        <Animated.View style={[styles.thumb, { backgroundColor: colors.bgRaised, borderColor: accent.solid }, thumbA]} />
        {range ? (
          <Animated.View style={[styles.thumb, { backgroundColor: colors.bgRaised, borderColor: accent.solid }, thumbB]} />
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: 'center' },
  track: { position: 'absolute', left: THUMB / 2, right: THUMB / 2, height: 6, borderRadius: 3 },
  fill: { position: 'absolute', height: 6, borderRadius: 3 },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
