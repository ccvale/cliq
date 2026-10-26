import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { accentFor, palettes, type Colors } from './tokens';
import { appearanceStore, type Appearance } from './preference';

type Theme = {
  scheme: 'light' | 'dark';
  colors: Colors;
  accent: ReturnType<typeof accentFor>;
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
};

const ThemeContext = createContext<Theme | null>(null);

/** The whole app is tinted with the signed-in person's palette, like the original Cliq. */
export function ThemeProvider({ palette, children }: { palette?: [string, string]; children: ReactNode }) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [appearance, setAppearanceState] = useState<Appearance>('system');
  useEffect(() => {
    void appearanceStore.get().then(setAppearanceState);
  }, []);
  const scheme = appearance === 'system' ? system : appearance;
  const value = useMemo(
    () =>
      ({
        scheme,
        colors: palettes[scheme],
        accent: accentFor(palette, scheme),
        appearance,
        setAppearance: (a: Appearance) => {
          setAppearanceState(a);
          void appearanceStore.set(a);
        },
      }) as Theme,
    [scheme, appearance, palette?.[0], palette?.[1]],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}
