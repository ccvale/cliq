import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './Txt';

export function LinkRow({ icon, label, detail, onPress }: { icon: ReactNode; label: string; detail?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.6 : 1 })}>
      {icon}
      <View style={{ flex: 1 }}>
        <Txt variant="label">{label}</Txt>
        {detail ? (
          <Txt variant="caption" tone="muted">
            {detail}
          </Txt>
        ) : null}
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}
