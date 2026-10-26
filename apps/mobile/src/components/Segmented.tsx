import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';

/** A row of mutually exclusive choices, like iOS's segmented control. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.bgSunken }]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => {
              if (on) return;
              if (Platform.OS !== 'web') void Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={[styles.option, on && { backgroundColor: colors.bgRaised, shadowOpacity: 0.08 }]}
          >
            <Txt variant="label" tone={on ? 'ink' : 'muted'} numberOfLines={1}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.md, padding: 3, gap: 3 },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.md - 3,
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
