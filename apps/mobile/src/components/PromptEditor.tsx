import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { MAX_PROMPTS, PROMPTS } from '@/lib/catalog';
import type { PromptAnswer } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Field } from './Field';
import { Sheet } from './Sheet';
import { Txt } from './Txt';

/** Up to three prompts, each picked from the catalog and answered in a sentence. */
export function PromptEditor({ value, onChange }: { value: PromptAnswer[]; onChange: (next: PromptAnswer[]) => void }) {
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);
  const used = new Set(value.map((p) => p.id));
  const available = Object.keys(PROMPTS).filter((id) => !used.has(id));

  return (
    <View style={{ gap: 14 }}>
      {value.map((p, i) => (
        <View key={p.id} style={{ gap: 6 }}>
          <View style={styles.row}>
            <Txt variant="label" style={{ flex: 1 }}>
              {PROMPTS[p.id]}
            </Txt>
            <Pressable onPress={() => onChange(value.filter((_, j) => j !== i))} hitSlop={10} accessibilityLabel={`Remove “${PROMPTS[p.id]}”`}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
          <Field
            value={p.answer}
            onChangeText={(answer) => onChange(value.map((q, j) => (j === i ? { ...q, answer } : q)))}
            multiline
            maxLength={150}
            counter={150}
            placeholder="Your answer"
          />
        </View>
      ))}
      {value.length < MAX_PROMPTS ? (
        <Button label={value.length ? 'Add another prompt' : 'Add a prompt'} variant="secondary" size="md" icon={<Plus size={16} color={colors.ink} />} onPress={() => setPicking(true)} />
      ) : null}
      <Sheet
        visible={picking}
        onClose={() => setPicking(false)}
        title="Pick a prompt"
        actions={available.map((id) => ({
          label: PROMPTS[id]!,
          onPress: () => onChange([...value, { id, answer: '' }]),
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
