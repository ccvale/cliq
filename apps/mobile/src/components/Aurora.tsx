import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

function Blob({ color, size, x, y, drift, duration }: { color: string; size: number; x: number; y: number; drift: number; duration: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x + drift * t.value }, { translateY: y - drift * 0.6 * t.value }, { scale: 1 + 0.12 * t.value }],
  }));
  const id = color.replace('#', 'g');
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.85} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** Slow-drifting color fields behind the welcome screen. */
export function Aurora({ colors }: { colors: [string, string, string] }) {
  const { width, height } = useWindowDimensions();
  const s = Math.max(width, height) * 0.9;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Blob color={colors[0]} size={s} x={-s * 0.45} y={-s * 0.35} drift={60} duration={9000} />
      <Blob color={colors[1]} size={s * 0.9} x={width - s * 0.5} y={height * 0.15} drift={-70} duration={11000} />
      <Blob color={colors[2]} size={s * 0.8} x={-s * 0.2} y={height - s * 0.45} drift={50} duration={13000} />
    </View>
  );
}
