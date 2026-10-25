import { type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Txt } from './Txt';

export function EmptyState({ art, title, body, action }: { art?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
      {art}
      <Txt variant="display" center>
        {title}
      </Txt>
      <Txt tone="muted" center style={{ maxWidth: 320 }}>
        {body}
      </Txt>
      {action ? <View style={{ marginTop: 12, alignSelf: 'stretch' }}>{action}</View> : null}
    </Animated.View>
  );
}
