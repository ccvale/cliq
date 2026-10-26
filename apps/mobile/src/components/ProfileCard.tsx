import { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, Clapperboard, MapPin, Music, Sparkles, Tv } from 'lucide-react-native';
import { photoSource } from '@/lib/api';
import { BADGES, PROMPTS } from '@/lib/catalog';
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
  const photo = photoSource(card.photoUrl);
  // Tapping the glass panel steps through the card's pages: bio and interests first, then each prompt.
  const prompts = card.prompts ?? [];
  const pages = 1 + prompts.length;
  const [page, setPage] = useState(0);
  const prompt = page > 0 ? prompts[page - 1] : undefined;
  const badges = (card.badges ?? []).filter((b) => BADGES[b]);

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
        {badges.length ? (
          <View style={styles.badges} accessibilityLabel={`Badges: ${badges.map((b) => BADGES[b]!.name).join(', ')}`}>
            {badges.slice(-5).map((b) => (
              <View key={b} style={styles.badge}>
                <Txt style={{ fontSize: 13 }}>{BADGES[b]!.emoji}</Txt>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={pages > 1 ? () => setPage((n) => (n + 1) % pages) : undefined}
        accessibilityRole={pages > 1 ? 'button' : undefined}
        accessibilityHint={pages > 1 ? 'Shows the next part of their profile' : undefined}
      >
        <BlurView intensity={28} tint="light" style={styles.panel}>
          {prompt ? (
            <View style={{ gap: 6 }}>
              <Txt variant="caption" style={styles.promptLabel}>
                {PROMPTS[prompt.id] ?? 'Prompt'}
              </Txt>
              <Txt style={styles.promptAnswer} numberOfLines={compact ? 3 : 5}>
                {prompt.answer}
              </Txt>
            </View>
          ) : (
            <>
              {card.bio ? (
                <Txt style={styles.bio} numberOfLines={compact ? 2 : 4}>
                  “{card.bio}”
                </Txt>
              ) : null}
              {card.featured ? <FeaturedRow featured={card.featured} /> : null}
              <View style={styles.chips}>
                {card.interests.map((i) => (
                  <Chip key={i} label={i} tone="glass" highlight={shared.has(i)} />
                ))}
              </View>
            </>
          )}
          {pages > 1 ? (
            <View style={styles.dots}>
              {Array.from({ length: pages }, (_, i) => (
                <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
              ))}
            </View>
          ) : null}
        </BlurView>
      </Pressable>
    </MeshGradient>
  );
}

const KIND_ICON = { song: Music, movie: Clapperboard, show: Tv } as const;

/** "On repeat" / "Favorite movie" / "Watching" with the artwork when there is some. */
export function FeaturedRow({ featured, tone = 'glass' }: { featured: NonNullable<Card['featured']>; tone?: 'glass' | 'plain' }) {
  const Icon = KIND_ICON[featured.kind];
  const label = { song: 'On repeat', movie: 'Favorite movie', show: 'Watching' }[featured.kind];
  const color = tone === 'glass' ? WHITE : undefined;
  return (
    <View style={styles.featured}>
      {featured.artworkUrl ? (
        <Image source={{ uri: featured.artworkUrl }} style={styles.artwork} contentFit="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.artwork, styles.artworkBlank]}>
          <Icon size={18} color={color ?? '#17141B'} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Txt variant="caption" style={color ? { color: 'rgba(255,255,255,0.8)' } : undefined} tone={color ? undefined : 'muted'}>
          {label}
        </Txt>
        <Txt variant="label" style={color ? { color } : undefined} numberOfLines={1}>
          {featured.title}
          {featured.subtitle ? <Txt variant="caption" style={color ? { color: 'rgba(255,255,255,0.8)' } : undefined} tone={color ? undefined : 'muted'}>{`  ${featured.subtitle}`}</Txt> : null}
        </Txt>
      </View>
    </View>
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
  badges: { flexDirection: 'row', gap: 4, marginTop: 2 },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  promptLabel: { color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.8 },
  promptAnswer: { fontFamily: font.display, fontSize: 22, lineHeight: 28, color: WHITE },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { backgroundColor: WHITE, width: 16 },
  featured: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  artwork: { width: 38, height: 38, borderRadius: 8 },
  artworkBlank: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.25)' },
});
