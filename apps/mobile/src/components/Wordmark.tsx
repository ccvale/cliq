import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font } from '@/theme/tokens';
import { Txt } from './Txt';

/** "cliq" set in Fraunces italic with a palette-colored dot over the i. */
export function Wordmark({ size = 30, color }: { size?: number; color?: string }) {
  const { colors, accent } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} accessibilityRole="header" accessibilityLabel="Cliq">
      <Txt style={{ fontFamily: font.displayItalic, fontSize: size, lineHeight: size * 1.15, color: color ?? colors.ink, letterSpacing: -size * 0.03 }}>
        cliq
      </Txt>
      <View style={{ width: size * 0.2, height: size * 0.2, borderRadius: size, backgroundColor: accent.to, marginLeft: 2, marginBottom: size * 0.2 }} />
    </View>
  );
}
