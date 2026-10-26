import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Clapperboard, Music, Pause, Play, Tv } from 'lucide-react-native';
import type { Featured, FeaturedKind, Palette } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { paletteTones } from './Avatar';
import { MeshGradient } from './MeshGradient';
import { Txt } from './Txt';

export const FEATURED_LABEL: Record<FeaturedKind, string> = { song: 'On repeat', show: 'Currently watching', movie: 'Favorite movie' };
export const FEATURED_ICON = { song: Music, show: Tv, movie: Clapperboard };

/** Album art or poster, or the person's palette with an icon when there's no artwork. */
export function FeaturedArt({ item, palette, size }: { item: Featured; palette: Palette; size: number }) {
  const Icon = FEATURED_ICON[item.kind];
  if (item.artworkUrl) {
    return <Image source={{ uri: item.artworkUrl }} style={{ width: size, height: size, borderRadius: size * 0.18 }} contentFit="cover" transition={200} />;
  }
  return (
    <MeshGradient {...paletteTones(palette)} style={{ width: size, height: size, borderRadius: size * 0.18, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.42} color="#fff" strokeWidth={2} />
    </MeshGradient>
  );
}

/** Plays Apple's 30 second preview. Only songs have one. */
function PreviewButton({ url }: { url: string }) {
  const { accent } = useTheme();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  useEffect(() => () => player.pause(), [player]);
  const toggle = () => {
    if (status.playing) return player.pause();
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.2)) void player.seekTo(0);
    player.play();
  };
  const Icon = status.playing ? Pause : Play;
  return (
    <Pressable onPress={toggle} hitSlop={10} accessibilityLabel={status.playing ? 'Pause preview' : 'Play preview'}>
      <MeshGradient from={accent.from} to={accent.to} style={styles.play}>
        <Icon size={18} color="#fff" fill="#fff" />
      </MeshGradient>
    </Pressable>
  );
}

/** The featured song, show or movie as a row: art, label, title, and a preview button for songs. */
export function FeaturedRow({ item, palette }: { item: Featured; palette: Palette }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={item.link ? () => void Linking.openURL(item.link!) : undefined}
      disabled={!item.link}
      style={[styles.row, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}
      accessibilityLabel={`${FEATURED_LABEL[item.kind]}: ${item.title}`}
    >
      <FeaturedArt item={item} palette={palette} size={56} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="eyebrow" tone="muted">
          {FEATURED_LABEL[item.kind]}
        </Txt>
        <Txt variant="heading" numberOfLines={1}>
          {item.title}
        </Txt>
        {item.subtitle ? (
          <Txt variant="caption" tone="muted" numberOfLines={1}>
            {item.subtitle}
          </Txt>
        ) : null}
      </View>
      {item.previewUrl ? <PreviewButton url={item.previewUrl} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  play: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
