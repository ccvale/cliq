import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font } from '@/theme/tokens';

const variants = {
  hero: { fontFamily: font.display, fontSize: 44, lineHeight: 48, letterSpacing: -1.2 },
  display: { fontFamily: font.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  title: { fontFamily: font.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: font.medium, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  eyebrow: { fontFamily: font.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.4, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TxtProps = TextProps & {
  variant?: keyof typeof variants;
  tone?: 'ink' | 'soft' | 'muted' | 'accent' | 'danger' | 'onAccent';
  italic?: boolean;
  center?: boolean;
};

export function Txt({ variant = 'body', tone = 'ink', italic, center, style, ...rest }: TxtProps) {
  const { colors, accent } = useTheme();
  const color = {
    ink: colors.ink,
    soft: colors.inkSoft,
    muted: colors.muted,
    accent: accent.solid,
    danger: colors.danger,
    onAccent: colors.onAccent,
  }[tone];
  return (
    <Text
      {...rest}
      style={[
        variants[variant],
        { color },
        italic && { fontFamily: font.displayItalic },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
