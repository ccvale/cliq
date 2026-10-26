import { StyleSheet, View } from 'react-native';
import { achievement } from '@/lib/achievements';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';

/** Small icon-only badges for the card, on glass. */
export function BadgeDots({ ids, max = 3 }: { ids: string[]; max?: number }) {
  const shown = ids.map(achievement).filter(Boolean).slice(0, max);
  if (!shown.length) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {shown.map((a) => {
        const Icon = a!.icon;
        return (
          <View key={a!.id} style={styles.dot} accessibilityLabel={`${a!.title} badge`}>
            <Icon size={12} color="#fff" strokeWidth={2.4} />
          </View>
        );
      })}
    </View>
  );
}

/** Badges with their names, for the full profile. */
export function BadgeList({ ids }: { ids: string[] }) {
  const { colors, accent } = useTheme();
  return (
    <View style={styles.list}>
      {ids.map(achievement).filter(Boolean).map((a) => {
        const Icon = a!.icon;
        return (
          <View key={a!.id} style={[styles.pill, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
            <Icon size={15} color={accent.solid} strokeWidth={2.2} />
            <Txt variant="label">{a!.title}</Txt>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
});
