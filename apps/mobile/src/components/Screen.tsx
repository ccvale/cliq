import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  maxWidth?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  keyboard?: boolean;
};

/** Page shell: safe areas, theme background, and a centered column so screens read well on wide web windows. */
export function Screen({ children, scroll, edges = ['top'], maxWidth = 560, style, contentStyle, keyboard }: Props) {
  const { colors } = useTheme();
  const column = [styles.column, { maxWidth }, contentStyle];
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[{ flexGrow: 1, alignItems: 'center' }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={column}>{children}</View>
    </ScrollView>
  ) : (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={[column, { flex: 1 }]}>{children}</View>
    </View>
  );
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ column: { width: '100%', paddingHorizontal: 20 } });
