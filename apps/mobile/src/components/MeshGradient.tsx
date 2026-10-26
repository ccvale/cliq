import { useId } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

type Props = ViewProps & { from: string; to: string; glow?: string; intensity?: number };

/**
 * A soft "mesh" made from a diagonal blend plus two radial glows. This is what replaces photos on
 * Cliq cards: each person's two palette colors become their visual identity.
 */
export function MeshGradient({ from, to, glow = '#FFFFFF', intensity = 1, style, children, ...rest }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View style={[styles.base, style]} {...rest}>
      <Svg style={styles.fill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`l${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
          <RadialGradient id={`a${id}`} cx="0.15" cy="0.1" r="0.7">
            <Stop offset="0" stopColor={glow} stopOpacity={0.55 * intensity} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`b${id}`} cx="0.95" cy="0.85" r="0.75">
            <Stop offset="0" stopColor={to} stopOpacity={0.9 * intensity} />
            <Stop offset="1" stopColor={to} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`c${id}`} cx="0.1" cy="0.95" r="0.6">
            <Stop offset="0" stopColor={from} stopOpacity={0.8 * intensity} />
            <Stop offset="1" stopColor={from} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#l${id})`} />
        <Rect width="100%" height="100%" fill={`url(#b${id})`} />
        <Rect width="100%" height="100%" fill={`url(#c${id})`} />
        <Rect width="100%" height="100%" fill={`url(#a${id})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // zIndex keeps the gradient beneath children on web, where bare <svg> icons aren't positioned elements.
  base: { overflow: 'hidden', zIndex: 0 },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
});
