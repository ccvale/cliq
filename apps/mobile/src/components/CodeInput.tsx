import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { font, radius } from '@/theme/tokens';
import { Txt } from './Txt';

const LENGTH = 6;

function Cell({ char, active, error }: { char: string; active: boolean; error: boolean }) {
  const { colors, accent } = useTheme();
  const lift = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(char ? 1 : 0.96, { damping: 14 }) }] }));
  return (
    <Animated.View
      style={[
        styles.cell,
        lift,
        { backgroundColor: colors.bgRaised, borderColor: error ? colors.danger : active ? accent.solid : colors.line },
      ]}
    >
      <Txt style={[styles.char, { color: colors.ink }]}>{char}</Txt>
    </Animated.View>
  );
}

/**
 * Six boxes over one hidden input, so paste, SMS/email autofill ("one-time-code") and the number pad
 * all work natively. Calls onComplete once all digits are in.
 */
export function CodeInput({ value, onChange, onComplete, error }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; error?: boolean }) {
  const ref = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(true);
  // autoFocus alone is lost when the screen mounts mid-transition, so focus again once it has settled.
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Verification code">
      <View style={styles.row}>
        {Array.from({ length: LENGTH }, (_, i) => (
          <Cell key={i} char={value[i] ?? ''} active={focused && (i === value.length || (i === LENGTH - 1 && value.length === LENGTH))} error={!!error} />
        ))}
      </View>
      <TextInput
        ref={ref}
        value={value}
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, '').slice(0, LENGTH);
          onChange(digits);
          if (digits.length === LENGTH) onComplete?.(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  cell: { flex: 1, maxWidth: 56, aspectRatio: 0.82, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  char: { fontFamily: font.display, fontSize: 28 },
  hidden: { position: 'absolute', opacity: 0, width: '100%', height: '100%', color: 'transparent', outlineStyle: 'none' } as any,
});
