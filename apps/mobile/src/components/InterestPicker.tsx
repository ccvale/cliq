import { View } from 'react-native';
import { INTEREST_NAMES, MAX_INTERESTS } from '@/lib/catalog';
import { Chip } from './Chip';

export function InterestPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (name: string) => {
    if (value.includes(name)) onChange(value.filter((v) => v !== name));
    else if (value.length < MAX_INTERESTS) onChange([...value, name]);
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {INTEREST_NAMES.map((name) => (
        <Chip key={name} label={name} selected={value.includes(name)} onPress={() => toggle(name)} />
      ))}
    </View>
  );
}
