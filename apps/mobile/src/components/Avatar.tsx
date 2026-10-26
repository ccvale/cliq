import { View } from 'react-native';
import { Image } from 'expo-image';
import { photoSource } from '@/lib/api';
import { PALETTE, type PaletteId } from '@/lib/catalog';
import { useTheme } from '@/theme/ThemeProvider';
import { font } from '@/theme/tokens';
import { MeshGradient } from './MeshGradient';
import { Txt } from './Txt';

export function paletteTones(palette: [string, string]) {
  return {
    from: (PALETTE[palette[0] as PaletteId] ?? PALETTE.iris).tone,
    to: (PALETTE[palette[1] as PaletteId] ?? PALETTE.rose).tone,
  };
}

type Props = { name: string; palette: [string, string]; photo?: string | null; size?: number; ring?: string; online?: boolean };

export function Avatar({ name, palette, photo, size = 48, ring, online }: Props) {
  const { colors } = useTheme();
  const source = photoSource(photo);
  const tones = paletteTones(palette);
  return (
    <View
      style={{
        width: size + (ring ? 6 : 0),
        height: size + (ring ? 6 : 0),
        borderRadius: size,
        padding: ring ? 2 : 0,
        borderWidth: ring ? 1.5 : 0,
        borderColor: ring,
      }}
    >
      <MeshGradient
        {...tones}
        style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
      >
        {source ? (
          <Image
            source={source}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Photo of ${name}`}
          />
        ) : (
          <Txt style={{ color: '#fff', fontFamily: font.display, fontSize: size * 0.42, lineHeight: size * 0.5 }}>
            {name.trim().charAt(0).toUpperCase() || '·'}
          </Txt>
        )}
      </MeshGradient>
      {online ? (
        <View
          accessibilityLabel="Online"
          style={{
            position: 'absolute',
            right: ring ? 2 : 0,
            bottom: ring ? 2 : 0,
            width: Math.max(12, size * 0.26),
            height: Math.max(12, size * 0.26),
            borderRadius: size,
            backgroundColor: colors.success,
            borderWidth: 2.5,
            borderColor: colors.bg,
          }}
        />
      ) : null}
    </View>
  );
}
