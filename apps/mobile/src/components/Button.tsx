import { type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { MeshGradient } from './MeshGradient';
import { Txt } from './Txt';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, size = 'lg', style }: Props) {
  const { colors, accent } = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const height = size === 'lg' ? 56 : 44;
  const inactive = disabled || loading;

  const surface: ViewStyle = {
    primary: { backgroundColor: colors.ink },
    accent: {},
    secondary: { backgroundColor: colors.bgRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.danger },
  }[variant];
  const textColor = {
    primary: colors.bg,
    accent: '#FFFFFF',
    secondary: colors.ink,
    ghost: colors.inkSoft,
    danger: colors.danger,
  }[variant];

  const content = (
    <View style={[styles.row, { height }]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Txt variant={size === 'lg' ? 'heading' : 'label'} style={{ color: textColor }}>
            {label}
          </Txt>
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[animated, { opacity: disabled ? 0.45 : 1 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!inactive, busy: !!loading }}
        disabled={inactive}
        onPressIn={() => (scale.value = withSpring(0.97, { damping: 20, stiffness: 400 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 300 }))}
        onPress={() => {
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={[styles.base, surface, { borderRadius: radius.pill }]}
      >
        {variant === 'accent' ? (
          <MeshGradient from={accent.from} to={accent.to} intensity={0.6} style={{ borderRadius: radius.pill }}>
            {content}
          </MeshGradient>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
});
