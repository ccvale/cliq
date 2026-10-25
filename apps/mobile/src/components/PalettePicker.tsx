import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { PALETTE, PALETTE_IDS, type PaletteId } from '@/lib/catalog';
import type { Palette } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './Txt';

function Swatch({ id, slot, onPress }: { id: PaletteId; slot: 0 | 1 | null; onPress: () => void }) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(slot === null ? 1 : 1.08, { damping: 12 }) }] }));
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={PALETTE[id].name} style={{ alignItems: 'center', gap: 6, width: 64 }}>
      <Animated.View
        style={[
          styles.swatch,
          { backgroundColor: PALETTE[id].tone, borderColor: slot === null ? 'transparent' : colors.ink },
          style,
        ]}
      >
        {slot !== null ? (
          <View style={[styles.badge, { backgroundColor: colors.ink }]}>
            <Txt variant="caption" style={{ color: colors.bg }}>
              {slot + 1}
            </Txt>
          </View>
        ) : null}
      </Animated.View>
      <Txt variant="caption" tone={slot === null ? 'muted' : 'ink'}>
        {PALETTE[id].name}
      </Txt>
    </Pressable>
  );
}

/** Pick two colors. Tapping fills slot 1 then slot 2; tapping a chosen color again swaps the order. */
export function PalettePicker({ value, onChange }: { value: Palette; onChange: (p: Palette) => void }) {
  const choose = (id: PaletteId) => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    const [a, b] = value;
    if (id === a) onChange([b, a]);
    else if (id === b) onChange([b, a]);
    else onChange([b, id]);
  };
  return (
    <View style={styles.grid}>
      {PALETTE_IDS.map((id) => (
        <Swatch key={id} id={id} slot={value[0] === id ? 0 : value[1] === id ? 1 : null} onPress={() => choose(id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  swatch: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'flex-end', justifyContent: 'flex-start' },
  badge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: -4, marginRight: -4 },
});
