import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { LogoMark } from '@/components/LogoMark';
import { Txt } from '@/components/Txt';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';

function Ripple({ delay, color }: { delay: number; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - t.value), transform: [{ scale: 0.6 + t.value * 1.6 }] }));
  return <Animated.View style={[styles.ripple, { borderColor: color }, style]} />;
}

/** "You clicked" moment: two avatars slide together while rings ripple out. */
export default function MatchMoment() {
  const { id, name, palette, photo } = useLocalSearchParams<{ id: string; name: string; palette: string; photo?: string }>();
  const { me } = useSession();
  const { scheme, accent } = useTheme();
  const theirs = (palette?.split(',') ?? ['iris', 'rose']) as [string, string];
  const left = useSharedValue(-60);
  const right = useSharedValue(60);

  useEffect(() => {
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    left.value = withSpring(14, { damping: 11, stiffness: 120 });
    right.value = withSpring(-14, { damping: 11, stiffness: 120 });
  }, []);
  const leftStyle = useAnimatedStyle(() => ({ transform: [{ translateX: left.value }, { rotate: '-6deg' }] }));
  const rightStyle = useAnimatedStyle(() => ({ transform: [{ translateX: right.value }, { rotate: '6deg' }] }));

  return (
    <BlurView intensity={70} tint={scheme} style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(250)} style={[StyleSheet.absoluteFill, { backgroundColor: scheme === 'dark' ? 'rgba(14,12,17,0.6)' : 'rgba(247,244,239,0.6)' }]} />
      <View style={styles.center}>
        <View style={styles.stage}>
          <Ripple delay={0} color={accent.from} />
          <Ripple delay={800} color={accent.to} />
          <Ripple delay={1600} color={accent.from} />
          <Animated.View style={leftStyle}>
            <Avatar name={me?.profile.displayName ?? ''} palette={me?.profile.palette ?? ['iris', 'rose']} photo={me?.profile.photoUrl} size={112} />
          </Animated.View>
          <Animated.View style={rightStyle}>
            <Avatar name={name ?? ''} palette={theirs} photo={photo || null} size={112} />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={{ gap: 10, alignItems: 'center', marginTop: 40 }}>
          <LogoMark size={72} animate="enter" style={{ marginBottom: 6 }} />
          <Txt variant="eyebrow" tone="accent">
            It’s mutual
          </Txt>
          <Txt variant="hero" center>
            You and {name}{'\n'}
            <Txt variant="hero" italic>
              clicked.
            </Txt>
          </Txt>
          <Txt tone="soft" center style={{ maxWidth: 300, marginTop: 4 }}>
            You both want to hang out. Break the ice while it’s fresh.
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(600)} style={{ alignSelf: 'stretch', gap: 10, marginTop: 40, maxWidth: 380, width: '100%' }}>
          <Button label="Say hi" variant="accent" onPress={() => router.replace({ pathname: '/chat/[id]', params: { id } })} />
          <Button label="Keep exploring" variant="ghost" onPress={() => router.back()} />
        </Animated.View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 180 },
  ripple: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2 },
});
