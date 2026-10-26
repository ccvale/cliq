import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';

export function Section({ title, children, footer }: { title: string; children: ReactNode; footer?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 10, marginTop: 28 }}>
      <Txt variant="eyebrow" tone="muted" style={{ marginLeft: 4 }}>
        {title}
      </Txt>
      <View style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>{children}</View>
      {footer ? (
        <Txt variant="caption" tone="muted" style={{ marginHorizontal: 4 }}>
          {footer}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 18, gap: 18, borderWidth: StyleSheet.hairlineWidth },
});
