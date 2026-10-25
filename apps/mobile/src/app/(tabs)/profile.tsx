import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PenLine, Settings } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { ProfileCard } from '@/components/ProfileCard';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { WIDE } from '@/theme/tokens';

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Txt variant="title">{value}</Txt>
      <Txt variant="caption" tone="muted">
        {label}
      </Txt>
    </View>
  );
}

export default function Profile() {
  const { me, reload } = useSession();
  // Stats change as you swipe, so refresh them whenever this tab comes into view.
  useFocusEffect(useCallback(() => void reload().catch(() => {}), [reload]));
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  if (!me) return null;
  const p = me.profile;
  const cardWidth = Math.min(width - 40, 380);
  const yesRate = me.stats.swipes ? `${Math.round((me.stats.likesSent / me.stats.swipes) * 100)}%` : '—';

  return (
    <Screen scroll maxWidth={560}>
      <View style={styles.header}>
        <Txt variant="display">You</Txt>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          accessibilityLabel="Settings"
          style={[styles.iconButton, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}
        >
          <Settings size={18} color={colors.ink} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', gap: 8 }}>
        <ProfileCard
          card={{
            id: me.id,
            displayName: p.displayName,
            age: p.age ?? 0,
            bio: p.bio,
            gigTitle: p.gigTitle,
            gigPlace: p.gigPlace,
            interests: p.interests,
            sharedInterests: [],
            palette: p.palette,
            city: p.city,
            distance: 'This is you',
          }}
          style={{ width: cardWidth, height: cardWidth * 1.35 }}
        />
        <Txt variant="caption" tone="muted" style={{ marginTop: 6 }}>
          This is how others see your card
        </Txt>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={[styles.stats, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <Stat value={me.stats.swipes} label="Seen" />
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
        <Stat value={yesRate} label="Said yes" />
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
        <Stat value={me.stats.matches} label="Friends" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ gap: 10, paddingBottom: width >= WIDE ? 32 : 120 }}>
        <Button label="Edit profile" icon={<PenLine size={18} color={colors.bg} />} onPress={() => router.push('/edit-profile')} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 8 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  stats: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingVertical: 18, marginVertical: 20, borderWidth: StyleSheet.hairlineWidth },
  divider: { width: StyleSheet.hairlineWidth, height: 32 },
});
