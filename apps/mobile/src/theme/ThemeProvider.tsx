import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { accentFor, palettes, type Colors } from './tokens';

type Theme = {
  scheme: 'light' | 'dark';
  colors: Colors;
  accent: ReturnType<typeof accentFor>;
};

const ThemeContext = createContext<Theme | null>(null);

/** The whole app is tinted with the signed-in person's palette, like the original Cliq. */
export function ThemeProvider({ palette, children }: { palette?: [string, string]; children: ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const value = useMemo(
    () => ({ scheme, colors: palettes[scheme], accent: accentFor(palette, scheme) }) as Theme,
    [scheme, palette?.[0], palette?.[1]],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}
