import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight, MailWarning } from 'lucide-react-native';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';

/** Nudge shown until the account's email is confirmed. Swiping and messaging wait on it. */
export function VerifyBanner({ action = 'start swiping' }: { action?: string }) {
  const { me } = useSession();
  const { colors, accent } = useTheme();
  if (!me || me.emailVerified || !me.email) return null;
  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Pressable
        onPress={() => router.push('/verify-email')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.banner, { backgroundColor: colors.bgRaised, borderColor: accent.solid, opacity: pressed ? 0.8 : 1 }]}
      >
        <MailWarning size={20} color={accent.solid} />
        <View style={{ flex: 1 }}>
          <Txt variant="label">Confirm your email to {action}</Txt>
          <Txt variant="caption" tone="muted" numberOfLines={1}>
            Enter the code we sent to {me.email}
          </Txt>
        </View>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, marginBottom: 12 },
});
