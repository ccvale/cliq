import { View } from 'react-native';
import { PALETTE, type PaletteId } from '@/lib/catalog';
import { font } from '@/theme/tokens';
import { MeshGradient } from './MeshGradient';
import { Txt } from './Txt';

export function paletteTones(palette: [string, string]) {
  return {
    from: (PALETTE[palette[0] as PaletteId] ?? PALETTE.iris).tone,
    to: (PALETTE[palette[1] as PaletteId] ?? PALETTE.rose).tone,
  };
}

export function Avatar({ name, palette, size = 48, ring }: { name: string; palette: [string, string]; size?: number; ring?: string }) {
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
        <Txt style={{ color: '#fff', fontFamily: font.display, fontSize: size * 0.42, lineHeight: size * 0.5 }}>
          {name.trim().charAt(0).toUpperCase() || '·'}
        </Txt>
      </MeshGradient>
    </View>
  );
}
