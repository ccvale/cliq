import { PALETTE, type PaletteId } from '@/lib/catalog';

const light = {
  bg: '#F7F4EF',
  bgRaised: '#FFFFFF',
  bgSunken: '#EFEBE4',
  ink: '#17141B',
  inkSoft: '#4A4550',
  muted: '#8A848F',
  line: 'rgba(23,20,27,0.08)',
  lineStrong: 'rgba(23,20,27,0.16)',
  glass: 'rgba(255,255,255,0.72)',
  danger: '#D6455D',
  success: '#2E9E7B',
  onAccent: '#FFFFFF',
};

const dark: typeof light = {
  bg: '#0E0C11',
  bgRaised: '#18151D',
  bgSunken: '#08070A',
  ink: '#F5F2F7',
  inkSoft: '#C9C3CF',
  muted: '#8C8592',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.16)',
  glass: 'rgba(24,21,29,0.72)',
  danger: '#FF6B81',
  success: '#4FD1A5',
  onAccent: '#FFFFFF',
};

export const palettes = { light, dark };
export type Colors = typeof light;

export const font = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };
export const space = (n: number) => n * 4;

export function accentFor(palette: [string, string] | undefined, scheme: 'light' | 'dark') {
  const [a, b] = (palette ?? ['iris', 'rose']) as [PaletteId, PaletteId];
  const first = PALETTE[a] ?? PALETTE.iris;
  const second = PALETTE[b] ?? PALETTE.rose;
  return {
    from: first.tone,
    to: second.tone,
    // Deep tones keep text legible on the light theme; bright tones read better on dark.
    solid: scheme === 'light' ? first.deep : first.tone,
  };
}

/** Above this window width (web, tablets) the app switches to a sidebar layout. */
export const WIDE = 900;
