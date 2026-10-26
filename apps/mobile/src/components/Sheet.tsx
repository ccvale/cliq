import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';

export type SheetAction = { label: string; onPress: () => void; destructive?: boolean };

/** A small bottom sheet of actions. Works the same on iOS, Android and web (unlike Alert with buttons). */
export function Sheet({ visible, title, message, actions, onClose }: {
  visible: boolean;
  title?: string;
  message?: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,7,10,0.45)' }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        style={[styles.sheet, { backgroundColor: colors.bgRaised, paddingBottom: insets.bottom + 12 }]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.lineStrong }]} />
        {title ? (
          <Txt variant="title" center style={{ marginTop: 8 }}>
            {title}
          </Txt>
        ) : null}
        {message ? (
          <Txt tone="muted" center style={{ marginTop: 6, marginBottom: 6 }}>
            {message}
          </Txt>
        ) : null}
        {/* Long lists (like the prompt picker) scroll instead of running off the top of the screen. */}
        <ScrollView style={{ marginTop: 12, maxHeight: height * 0.6 }} contentContainerStyle={{ gap: 2 }} bounces={false}>
          {[...actions, { label: 'Cancel', onPress: onClose }].map((a, i) => (
            <Pressable
              key={a.label}
              onPress={() => {
                onClose();
                if (i < actions.length) a.onPress();
              }}
              style={({ pressed }) => [styles.action, { backgroundColor: pressed ? colors.bgSunken : 'transparent' }]}
            >
              <Txt variant="heading" center tone={'destructive' in a && a.destructive ? 'danger' : i === actions.length ? 'muted' : 'ink'}>
                {a.label}
              </Txt>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'center',
    maxWidth: 520,
    width: '100%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
  action: { paddingVertical: 16, borderRadius: radius.md },
});
