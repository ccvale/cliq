import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { api } from '@/lib/api';
import { FEATURED_KINDS } from '@/lib/catalog';
import type { Featured } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Chip } from './Chip';
import { Field } from './Field';
import { FeaturedRow } from './ProfileCard';
import { Txt } from './Txt';

/** Search songs, movies and shows (iTunes), or keep what you typed if search can't find it. */
export function FeaturedPicker({ value, onChange }: { value: Featured | null; onChange: (next: Featured | null) => void }) {
  const { colors, accent } = useTheme();
  const [kind, setKind] = useState<Featured['kind']>(value?.kind ?? 'song');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Featured[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search a moment after typing stops, and ignore answers to older queries.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let live = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const r = await api.searchFeatured(kind, q);
        if (live) setResults(r.results);
      } catch (e: any) {
        if (live) setError(e.message);
      } finally {
        if (live) setSearching(false);
      }
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, kind]);

  const pick = (f: Featured) => {
    onChange(f);
    setQuery('');
    setResults([]);
  };

  return (
    <View style={{ gap: 14 }}>
      {value ? (
        <View style={[styles.current, { backgroundColor: colors.bgSunken }]}>
          <View style={{ flex: 1 }}>
            <FeaturedRow featured={value} tone="plain" />
          </View>
          <Pressable onPress={() => onChange(null)} hitSlop={10} accessibilityLabel="Remove featured pick">
            <X size={18} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.kinds}>
        {(Object.keys(FEATURED_KINDS) as Featured['kind'][]).map((k) => (
          <Chip key={k} label={FEATURED_KINDS[k]} selected={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>
      <Field
        value={query}
        onChangeText={setQuery}
        placeholder={`Search for a ${FEATURED_KINDS[kind].toLowerCase()}`}
        autoCorrect={false}
        returnKeyType="search"
        maxLength={80}
      />
      {searching ? <ActivityIndicator color={accent.solid} /> : null}
      {error ? (
        <Txt variant="caption" tone="danger">
          {error}
        </Txt>
      ) : null}
      {results.map((r) => (
        <Pressable
          key={`${r.title}-${r.subtitle}`}
          onPress={() => pick(r)}
          style={({ pressed }) => [styles.result, { backgroundColor: pressed ? colors.bgSunken : 'transparent' }]}
        >
          {r.artworkUrl ? <Image source={{ uri: r.artworkUrl }} style={styles.art} /> : <View style={[styles.art, { backgroundColor: colors.bgSunken }]} />}
          <View style={{ flex: 1 }}>
            <Txt variant="label" numberOfLines={1}>
              {r.title}
            </Txt>
            <Txt variant="caption" tone="muted" numberOfLines={1}>
              {[r.subtitle, r.year].filter(Boolean).join(' · ')}
            </Txt>
          </View>
        </Pressable>
      ))}
      {query.trim().length >= 2 && !searching ? (
        <Pressable onPress={() => pick({ kind, title: query.trim(), subtitle: '', artworkUrl: null, year: null })} hitSlop={6}>
          <Txt variant="caption" tone="accent">
            Use “{query.trim()}” as typed
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  current: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md },
  kinds: { flexDirection: 'row', gap: 8 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 6, borderRadius: radius.md },
  art: { width: 44, height: 44, borderRadius: 8 },
});
