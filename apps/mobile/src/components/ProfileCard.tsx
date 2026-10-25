import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Briefcase, MapPin, Sparkles } from 'lucide-react-native';
import type { Card } from '@/lib/types';
import { font, radius } from '@/theme/tokens';
import { paletteTones } from './Avatar';
import { Chip } from './Chip';
import { MeshGradient } from './MeshGradient';
import { Txt } from './Txt';

const WHITE = '#FFFFFF';

export function ProfileCard({ card, style, compact }: { card: Card; style?: ViewStyle; compact?: boolean }) {
  const tones = paletteTones(card.palette);
  const shared = new Set(card.sharedInterests);
  const gig = [card.gigTitle, card.gigPlace].filter(Boolean).join(' · ');

  return (
    <MeshGradient {...tones} style={[styles.card, style]}>
      {/* Oversized initial as a quiet watermark. */}
      <Txt style={styles.watermark} numberOfLines={1}>
        {card.displayName.charAt(0)}
      </Txt>

      <View style={styles.topRow}>
        <View style={styles.pill}>
          <MapPin size={13} color={WHITE} strokeWidth={2.4} />
          <Txt variant="caption" style={{ color: WHITE }} numberOfLines={1}>
            {card.distance}
            {card.city ? ` · ${card.city.split(',')[0]}` : ''}
          </Txt>
        </View>
        {shared.size > 0 ? (
          <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.92)', flexShrink: 0 }]}>
            <Sparkles size={13} color="#17141B" strokeWidth={2.4} />
            <Txt variant="caption" style={{ color: '#17141B' }} numberOfLines={1}>
              {shared.size} in common
            </Txt>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.identity}>
        <Txt style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
          {card.displayName}
          <Txt style={styles.age}>  {card.age}</Txt>
        </Txt>
        {gig ? (
          <View style={styles.gig}>
            <Briefcase size={15} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
            <Txt variant="label" style={{ color: 'rgba(255,255,255,0.92)' }} numberOfLines={1}>
              {gig}
            </Txt>
          </View>
        ) : null}
      </View>

      <BlurView intensity={28} tint="light" style={styles.panel}>
        {card.bio ? (
          <Txt style={styles.bio} numberOfLines={compact ? 2 : 4}>
            “{card.bio}”
          </Txt>
        ) : null}
        <View style={styles.chips}>
          {card.interests.map((i) => (
            <Chip key={i} label={i} tone="glass" highlight={shared.has(i)} />
          ))}
        </View>
      </BlurView>
    </MeshGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: 20,
    shadowColor: '#17141B',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  watermark: {
    position: 'absolute',
    right: -24,
    top: -40,
    fontFamily: font.display,
    fontSize: 300,
    lineHeight: 330,
    color: 'rgba(255,255,255,0.14)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23,20,27,0.22)',
    flexShrink: 1,
  },
  identity: { gap: 6, marginBottom: 16 },
  name: { fontFamily: font.display, fontSize: 46, lineHeight: 52, letterSpacing: -1.2, color: WHITE },
  age: { fontFamily: font.displayItalic, fontSize: 30, color: 'rgba(255,255,255,0.85)' },
  gig: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panel: {
    borderRadius: radius.lg,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  bio: { fontFamily: font.displayItalic, fontSize: 17, lineHeight: 24, color: WHITE },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
