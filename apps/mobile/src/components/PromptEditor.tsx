import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { MAX_PROMPTS, PROMPTS } from '@/lib/catalog';
import type { Prompt } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Field } from './Field';
import { Txt } from './Txt';

/** Up to three prompts: pick a question, write an answer. */
export function PromptEditor({ value, onChange }: { value: Prompt[]; onChange: (v: Prompt[]) => void }) {
  const { colors, accent } = useTheme();
  // Which prompt's question is being picked: an index, 'new' for a new one, or null.
  const [choosing, setChoosing] = useState<number | 'new' | null>(value.length ? null : 'new');
  const used = new Set(value.map((p) => p.question));

  const pick = (question: string) => {
    if (choosing === 'new') onChange([...value, { question, answer: '' }]);
    else if (choosing !== null) onChange(value.map((p, i) => (i === choosing ? { ...p, question } : p)));
    setChoosing(null);
  };

  return (
    <View style={{ gap: 18 }}>
      {value.map((p, i) => (
        <View key={p.question} style={{ gap: 8 }}>
          <View style={styles.head}>
            <Pressable onPress={() => setChoosing(i)} style={{ flex: 1 }} accessibilityLabel={`Change question: ${p.question}`}>
              <Txt variant="heading" tone="accent">
                {p.question}
              </Txt>
            </Pressable>
            <Pressable onPress={() => onChange(value.filter((_, j) => j !== i))} hitSlop={10} accessibilityLabel={`Remove ${p.question}`}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
          <Field
            value={p.answer}
            onChangeText={(answer) => onChange(value.map((x, j) => (j === i ? { ...x, answer } : x)))}
            placeholder="Your answer"
            multiline
            maxLength={160}
          />
        </View>
      ))}

      {choosing !== null ? (
        <View style={{ gap: 8 }}>
          <Txt variant="caption" tone="muted">
            Pick a question
          </Txt>
          <View style={styles.choices}>
            {PROMPTS.filter((q) => !used.has(q)).map((q) => (
              <Pressable key={q} onPress={() => pick(q)} style={({ pressed }) => [styles.choice, { borderColor: colors.line, backgroundColor: pressed ? colors.bgSunken : colors.bg }]}>
                <Txt variant="label">{q}</Txt>
              </Pressable>
            ))}
          </View>
          {value.length ? (
            <Pressable onPress={() => setChoosing(null)} hitSlop={8}>
              <Txt variant="label" tone="muted">
                Cancel
              </Txt>
            </Pressable>
          ) : null}
        </View>
      ) : value.length < MAX_PROMPTS ? (
        <Pressable onPress={() => setChoosing('new')} style={styles.add} accessibilityLabel="Add a prompt">
          <Plus size={18} color={accent.solid} />
          <Txt variant="heading" tone="accent">
            Add a prompt
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  add: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
