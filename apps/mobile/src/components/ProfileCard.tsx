import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, ChevronUp, MapPin, Sparkles } from 'lucide-react-native';
import { photoSource } from '@/lib/api';
import type { Card } from '@/lib/types';
import { font, radius } from '@/theme/tokens';
import { paletteTones } from './Avatar';
import { BadgeDots } from './Badges';
import { Chip } from './Chip';
import { FEATURED_ICON } from './Featured';
import { MeshGradient } from './MeshGradient';
import { Txt } from './Txt';

const WHITE = '#FFFFFF';

/** onMore adds a button that opens the full profile (prompts, featured pick, badges). */
export function ProfileCard({ card, style, compact, onMore }: { card: Card; style?: ViewStyle; compact?: boolean; onMore?: () => void }) {
  const tones = paletteTones(card.palette);
  const shared = new Set(card.sharedInterests);
  const gig = [card.gigTitle, card.gigPlace].filter(Boolean).join(' · ');
  const photo = photoSource(card.photoUrl);
  const FeaturedIcon = card.featured ? FEATURED_ICON[card.featured.kind] : null;

  return (
    <MeshGradient {...tones} style={[styles.card, style]}>
      {photo ? (
        <>
          <Image source={photo} style={[StyleSheet.absoluteFill, styles.photo]} contentFit="cover" transition={250} accessibilityLabel={`Photo of ${card.displayName}`} />
          {/* Fade the photo into the palette so the type stays legible and the colors still lead. */}
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'transparent', `${tones.to}cc`, tones.to]}
            locations={[0, 0.3, 0.68, 1]}
            style={[StyleSheet.absoluteFill, styles.photo]}
          />
        </>
      ) : (
        /* Oversized initial as a quiet watermark. */
        <Txt style={styles.watermark} numberOfLines={1}>
          {card.displayName.charAt(0)}
        </Txt>
      )}

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

      <View style={styles.identityRow}>
        <View style={styles.identity}>
          <Txt style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
            {card.displayName}
            <Txt style={styles.age}>  {card.age}</Txt>
          </Txt>
          {gig ? (
            <View style={styles.gig}>
              <Briefcase size={15} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
              <Txt variant="label" style={{ color: 'rgba(255,255,255,0.92)', flexShrink: 1 }} numberOfLines={1}>
                {gig}
              </Txt>
            </View>
          ) : null}
          <BadgeDots ids={card.badges ?? []} />
        </View>
        {onMore ? (
          <Pressable onPress={onMore} hitSlop={10} accessibilityLabel={`More about ${card.displayName}`} style={styles.more}>
            <ChevronUp size={22} color="#fff" strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>

      <BlurView intensity={28} tint="light" style={styles.panel}>
        {card.featured && FeaturedIcon ? (
          <View style={styles.featured}>
            <FeaturedIcon size={14} color={WHITE} strokeWidth={2.4} />
            <Txt variant="label" style={{ color: WHITE, flexShrink: 1 }} numberOfLines={1}>
              {card.featured.title}
              {card.featured.subtitle && card.featured.kind === 'song' ? <Txt variant="label" style={{ color: 'rgba(255,255,255,0.75)' }}>{`  ·  ${card.featured.subtitle}`}</Txt> : null}
            </Txt>
          </View>
        ) : null}
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
  photo: { borderRadius: radius.xl },
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
  identityRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 16 },
  identity: { gap: 6, flex: 1 },
  more: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  featured: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
