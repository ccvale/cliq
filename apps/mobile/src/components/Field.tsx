import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { font, radius } from '@/theme/tokens';
import { Txt } from './Txt';

type Props = TextInputProps & { label?: string; hint?: string; error?: string | null; counter?: number };

export const Field = forwardRef<TextInputInstance, Props>(function Field({ label, hint, error, counter, style, multiline, ...rest }, ref) {
  const { colors, accent } = useTheme();
  const [focused, setFocused] = useState(false);
  const length = typeof rest.value === 'string' ? rest.value.length : 0;
  return (
    <View style={{ gap: 8 }}>
      {label ? (
        <View style={styles.labelRow}>
          <Txt variant="label" tone="soft">
            {label}
          </Txt>
          {counter ? (
            <Txt variant="caption" tone={length > counter ? 'danger' : 'muted'}>
              {length}/{counter}
            </Txt>
          ) : null}
        </View>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        selectionColor={accent.solid}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: colors.ink,
            backgroundColor: colors.bgRaised,
            borderColor: error ? colors.danger : focused ? accent.solid : colors.line,
            minHeight: multiline ? 112 : 54,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Txt variant="caption" tone="danger">
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="caption" tone="muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: font.body,
    fontSize: 16,
    outlineStyle: 'none',
  } as any,
});
