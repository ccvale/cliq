import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search, X } from 'lucide-react-native';
import { api } from '@/lib/api';
import type { Gif } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Field } from './Field';
import { Txt } from './Txt';

/** Trending GIFs, or search results as you type. Powered by GIPHY. */
export function GifPicker({ visible, onPick, onClose }: { visible: boolean; onPick: (gif: Gif) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [q, setQ] = useState('');
  const [gifs, setGifs] = useState<Gif[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const r = await api.searchGifs(q.trim());
        if (live) {
          setGifs(r.gifs);
          setError(null);
        }
      } catch (e: any) {
        if (live) setError(e.message);
      }
    }, q ? 350 : 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, visible]);

  const column = (Math.min(width, 640) - 40 - 8) / 2;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,7,10,0.45)' }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View entering={SlideInDown.springify().damping(20)} style={[styles.sheet, { backgroundColor: colors.bg, height: height * 0.7, paddingBottom: insets.bottom }]}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Field value={q} onChangeText={setQ} placeholder="Search GIFs" autoCorrect={false} style={{ paddingLeft: 44 }} />
            <View style={styles.icon} pointerEvents="none">
              <Search size={18} color={colors.muted} />
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <X size={22} color={colors.ink} />
          </Pressable>
        </View>
        {error ? (
          <Txt tone="muted" center style={{ marginTop: 24 }}>
            {error}
          </Txt>
        ) : gifs === null ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={colors.muted} />
        ) : (
          <FlatList
            data={gifs}
            numColumns={2}
            keyExtractor={(g) => g.id}
            columnWrapperStyle={{ gap: 8 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => onPick(item)} accessibilityLabel="Send this GIF">
                <Image source={{ uri: item.previewUrl }} style={{ width: column, height: (column * item.height) / item.width, borderRadius: 12, backgroundColor: colors.bgSunken }} contentFit="cover" />
              </Pressable>
            )}
            ListFooterComponent={
              <Txt variant="caption" tone="muted" center style={{ marginTop: 8 }}>
                Powered by GIPHY
              </Txt>
            }
          />
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  icon: { position: 'absolute', left: 16, top: 0, bottom: 0, justifyContent: 'center' },
});
