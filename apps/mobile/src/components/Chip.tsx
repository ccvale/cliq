import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { INTERESTS } from '@/lib/catalog';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';

type Props = { label: string; selected?: boolean; onPress?: () => void; tone?: 'default' | 'glass'; highlight?: boolean };

export function Chip({ label, selected, onPress, tone = 'default', highlight }: Props) {
  const { colors, accent } = useTheme();
  const emoji = INTERESTS[label];
  const style = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(selected ? 1.04 : 1, { damping: 14 }) }] }));

  const glass = tone === 'glass';
  const bg = glass
    ? highlight
      ? 'rgba(255,255,255,0.95)'
      : 'rgba(255,255,255,0.22)'
    : selected
      ? accent.solid
      : colors.bgRaised;
  const fg = glass ? (highlight ? '#17141B' : '#FFFFFF') : selected ? '#FFFFFF' : colors.ink;

  const body = (
    <Animated.View
      style={[
        styles.chip,
        { backgroundColor: bg, borderColor: glass ? 'rgba(255,255,255,0.35)' : selected ? accent.solid : colors.line },
        style,
      ]}
    >
      <Txt variant="label" style={{ color: fg }}>
        {emoji ? `${emoji}  ` : ''}
        {label}
      </Txt>
    </Animated.View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        onPress();
      }}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
