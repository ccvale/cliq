import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './Txt';

export function ScreenHeader({ title, close, right }: { title: string; close?: boolean; right?: ReactNode }) {
  const { colors } = useTheme();
  const Icon = close ? X : ArrowLeft;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={close ? 'Close' : 'Back'} style={{ width: 60 }}>
        <Icon size={24} color={colors.ink} />
      </Pressable>
      <Txt variant="heading">{title}</Txt>
      <View style={{ width: 60, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
