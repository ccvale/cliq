import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BADGES } from '@/lib/catalog';
import type { Achievement } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';

/** Every badge: earned ones in color, the rest faded with how to get them. Tap one to see its details. */
export function BadgeShelf({ achievements }: { achievements: Achievement[] }) {
  const { colors, accent } = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  const earned = achievements.filter((a) => a.earnedAt).length;
  const selected = achievements.find((a) => a.id === open);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.header}>
        <Txt variant="heading">Badges</Txt>
        <Txt variant="caption" tone="muted">
          {earned} of {achievements.length}
        </Txt>
      </View>
      <View style={styles.grid}>
        {achievements.map((a) => {
          const badge = BADGES[a.id];
          if (!badge) return null;
          return (
            <Pressable
              key={a.id}
              onPress={() => setOpen(open === a.id ? null : a.id)}
              accessibilityLabel={`${badge.name}${a.earnedAt ? ', earned' : `, locked. ${badge.how}`}`}
              style={[
                styles.badge,
                { backgroundColor: colors.bgRaised, borderColor: open === a.id ? accent.solid : colors.line },
                !a.earnedAt && { opacity: 0.4 },
              ]}
            >
              <Txt style={{ fontSize: 26 }}>{badge.emoji}</Txt>
              <Txt variant="caption" center numberOfLines={1}>
                {badge.name}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      {selected && BADGES[selected.id] ? (
        <Txt variant="caption" tone="muted" center>
          {selected.earnedAt
            ? `Earned ${new Date(selected.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
            : BADGES[selected.id]!.how}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  badge: {
    width: '31%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
