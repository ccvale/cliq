import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';

function Dot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 320 }), withTiming(0, { duration: 320 })), -1));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + v.value * 0.65, transform: [{ translateY: -3 * v.value }] }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.muted }, style]} />;
}

export function TypingDots() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: colors.bgRaised,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 20,
        borderBottomLeftRadius: 6,
      }}
    >
      <Dot delay={0} />
      <Dot delay={140} />
      <Dot delay={280} />
    </View>
  );
}
