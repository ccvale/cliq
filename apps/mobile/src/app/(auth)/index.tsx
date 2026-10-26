import { Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Mail } from 'lucide-react-native';
import { Aurora } from '@/components/Aurora';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Wordmark } from '@/components/Wordmark';
import { LogoMark } from '@/components/LogoMark';
import { AppleSignIn } from '@/components/AppleSignIn';
import { GoogleSignIn, googleConfigured } from '@/components/GoogleSignIn';
import { PALETTE } from '@/lib/catalog';
import { useTheme } from '@/theme/ThemeProvider';

export default function Welcome() {
  const { colors, scheme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Aurora colors={[PALETTE.iris.tone, PALETTE.rose.tone, PALETTE.apricot.tone]} />
      {/* Soft veil so the type stays crisp over the color. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, opacity: scheme === 'dark' ? 0.55 : 0.35 }]} />
      <Screen edges={['top', 'bottom']} style={{ backgroundColor: 'transparent' }} maxWidth={460}>
        <Animated.View entering={FadeIn.duration(600)} style={{ paddingTop: 24 }}>
          <Wordmark size={34} mark={false} />
        </Animated.View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
          <LogoMark size={132} animate="enter" style={{ marginBottom: 12, marginLeft: -6 }} />
          <Animated.View entering={FadeInDown.delay(150).duration(700)}>
            <Txt variant="eyebrow" tone="soft">
              Friends, not dates
            </Txt>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250).duration(700)}>
            <Txt variant="hero">
              Find your people,{'\n'}
              <Txt variant="hero" italic>
                right around the corner.
              </Txt>
            </Txt>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(380).duration(700)}>
            <Txt tone="soft" style={{ maxWidth: 360 }}>
              Swipe through people nearby who share what you love. When you both say yes, you click.
            </Txt>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(520).duration(700)} style={{ gap: 12, paddingBottom: 16 }}>
          {Platform.OS === 'ios' ? <AppleSignIn /> : null}
          {googleConfigured ? <GoogleSignIn /> : null}
          <Button
            label="Get started with email"
            icon={<Mail size={18} color={colors.bg} />}
            onPress={() => router.push('/sign-up')}
          />
          <Button label="I already have an account" variant="ghost" onPress={() => router.push('/sign-in')} />
        </Animated.View>
      </Screen>
    </View>
  );
}
