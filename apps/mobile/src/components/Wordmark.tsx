import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font } from '@/theme/tokens';
import { LogoMark } from './LogoMark';
import { Txt } from './Txt';

/** The Cliq mark beside "cliq" set in Fraunces italic, with a palette-colored dot. */
export function Wordmark({ size = 30, color, mark = true }: { size?: number; color?: string; mark?: boolean }) {
  const { colors, accent } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} accessibilityRole="header" accessibilityLabel="Cliq">
      {mark ? <LogoMark size={size * 1.3} color={color} style={{ marginRight: size * 0.24, marginBottom: size * 0.2 }} /> : null}
      <Txt style={{ fontFamily: font.displayItalic, fontSize: size, lineHeight: size * 1.15, color: color ?? colors.ink, letterSpacing: -size * 0.03 }}>
        cliq
      </Txt>
      <View style={{ width: size * 0.2, height: size * 0.2, borderRadius: size, backgroundColor: accent.to, marginLeft: 2, marginBottom: size * 0.2 }} />
    </View>
  );
}
