import { useEffect, useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The original Cliq mark (two arrows meeting, with sparks where they click), redrawn as clean vectors
 * from the 2024 logo so it can be tinted with the palette and animated part by part.
 */
const VIEWBOX = '0 150 800 500';
const RATIO = 500 / 800;
const LEFT = 'M40 350H160L135 232L472 396L135 560L160 442H40Z';
const RIGHT = 'M760 350H640L665 232L328 396L665 560L640 442H760Z';
const SPARKS = 'M305 178L338 250M495 178L462 250M305 614L338 542M495 614L462 542';

type Props = {
  size?: number;
  /** A solid color. Defaults to a gradient in the person's palette. */
  color?: string;
  /** 'enter' plays the click once on mount; 'loop' repeats it, for loading states. */
  animate?: 'enter' | 'loop';
  style?: ViewStyle;
};

function Layer({ d, stroke, gradient, size }: { d: string; stroke: string; gradient?: [string, string]; size: number }) {
  // Thicker lines at small sizes so the mark doesn't turn spidery in headers.
  const weight = size < 80 ? 50 : 36;
  const id = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size * RATIO} viewBox={VIEWBOX} style={StyleSheet.absoluteFill}>
      {gradient ? (
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={gradient[0]} />
            <Stop offset="1" stopColor={gradient[1]} />
          </LinearGradient>
        </Defs>
      ) : null}
      <Path d={d} fill="none" stroke={gradient ? `url(#${id})` : stroke} strokeWidth={weight} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export function LogoMark({ size = 48, color, animate, style }: Props) {
  const { accent } = useTheme();
  const gradient: [string, string] | undefined = color ? undefined : [accent.from, accent.to];
  const stroke = color ?? accent.solid;
  // 0 = apart, 1 = clicked together.
  const t = useSharedValue(animate ? 0 : 1);
  const spark = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    const click = () => withSpring(1, { damping: 9, stiffness: 140 });
    const pop = () => withSequence(withTiming(1.25, { duration: 160, easing: Easing.out(Easing.quad) }), withSpring(1, { damping: 8 }));
    if (animate === 'enter') {
      t.value = withDelay(150, click());
      spark.value = withDelay(380, pop());
    } else {
      t.value = withRepeat(withSequence(withTiming(0, { duration: 500, easing: Easing.inOut(Easing.quad) }), click(), withDelay(700, withTiming(1, { duration: 0 }))), -1);
      spark.value = withRepeat(withSequence(withTiming(0, { duration: 500 }), withDelay(250, pop()), withDelay(450, withTiming(1, { duration: 0 }))), -1);
    }
  }, [animate]);

  const travel = size * 0.22;
  const left = useAnimatedStyle(() => ({ transform: [{ translateX: -travel * (1 - t.value) }], opacity: 0.3 + 0.7 * Math.min(1, t.value * 1.5) }));
  const right = useAnimatedStyle(() => ({ transform: [{ translateX: travel * (1 - t.value) }], opacity: 0.3 + 0.7 * Math.min(1, t.value * 1.5) }));
  const sparks = useAnimatedStyle(() => ({ opacity: Math.min(1, spark.value), transform: [{ scale: 0.6 + 0.4 * spark.value }] }));

  return (
    <View style={[{ width: size, height: size * RATIO }, style]} accessibilityRole="image" accessibilityLabel="Cliq logo">
      <Animated.View style={[StyleSheet.absoluteFill, left]}>
        <Layer d={LEFT} stroke={stroke} gradient={gradient} size={size} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, right]}>
        <Layer d={RIGHT} stroke={stroke} gradient={gradient} size={size} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, sparks]}>
        <Layer d={SPARKS} stroke={stroke} gradient={gradient} size={size} />
      </Animated.View>
    </View>
  );
}

/** Raw paths, for generating icons and email art outside React. */
export const LOGO_PATHS = { viewBox: VIEWBOX, left: LEFT, right: RIGHT, sparks: SPARKS };
