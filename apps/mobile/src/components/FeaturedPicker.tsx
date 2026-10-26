import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { api } from '@/lib/api';
import type { Featured, FeaturedKind, Palette } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { FeaturedArt, FeaturedRow } from './Featured';
import { Field } from './Field';
import { Segmented } from './Segmented';
import { Txt } from './Txt';

const KINDS: { value: FeaturedKind; label: string }[] = [
  { value: 'song', label: 'Song' },
  { value: 'show', label: 'TV show' },
  { value: 'movie', label: 'Movie' },
];

/** Search Apple's catalog for a song, show or movie and pick one to feature. */
export function FeaturedPicker({ value, onChange, palette }: { value: Featured | null; onChange: (v: Featured | null) => void; palette: Palette }) {
  const { colors } = useTheme();
  const [kind, setKind] = useState<FeaturedKind>(value?.kind ?? 'song');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Featured[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search as they type, after a short pause.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setResults(null);
    let live = true;
    const t = setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const r = await api.searchFeatured(kind, term);
        if (live) setResults(r.results);
      } catch (e: any) {
        if (live) setError(e.message);
      } finally {
        if (live) setBusy(false);
      }
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, kind]);

  return (
    <View style={{ gap: 14 }}>
      {value ? (
        <View style={{ gap: 8 }}>
          <FeaturedRow item={value} palette={palette} />
          <Pressable onPress={() => onChange(null)} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
            <Txt variant="label" tone="muted">
              Remove
            </Txt>
          </Pressable>
        </View>
      ) : null}
      <Segmented options={KINDS} value={kind} onChange={setKind} />
      <View>
        <Field
          value={q}
          onChangeText={setQ}
          placeholder={kind === 'song' ? 'Search songs or artists' : kind === 'show' ? 'Search TV shows' : 'Search movies'}
          autoCorrect={false}
          returnKeyType="search"
          style={{ paddingLeft: 44 }}
        />
        <View style={styles.icon} pointerEvents="none">
          {busy ? <ActivityIndicator size="small" color={colors.muted} /> : <Search size={18} color={colors.muted} />}
        </View>
      </View>
      {error ? (
        <Txt variant="caption" tone="danger">
          {error}
        </Txt>
      ) : null}
      {results?.length === 0 && !busy ? (
        <Txt variant="caption" tone="muted">
          Nothing found. Try another spelling.
        </Txt>
      ) : null}
      {results?.map((r) => (
        <Pressable
          key={`${r.title}-${r.subtitle}`}
          onPress={() => {
            onChange(r);
            setQ('');
            setResults(null);
          }}
          style={({ pressed }) => [styles.result, { backgroundColor: pressed ? colors.bgSunken : 'transparent' }]}
          accessibilityLabel={`Feature ${r.title}`}
        >
          <FeaturedArt item={r} palette={palette} size={44} />
          <View style={{ flex: 1 }}>
            <Txt variant="label" numberOfLines={1}>
              {r.title}
            </Txt>
            <Txt variant="caption" tone="muted" numberOfLines={1}>
              {r.subtitle}
            </Txt>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { position: 'absolute', left: 16, top: 0, bottom: 0, justifyContent: 'center' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 6, borderRadius: 14 },
});
