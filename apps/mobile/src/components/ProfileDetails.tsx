import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import type { Card } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { font, radius } from '@/theme/tokens';
import { BadgeList } from './Badges';
import { Chip } from './Chip';
import { FeaturedRow } from './Featured';
import { ProfileCard } from './ProfileCard';
import { Txt } from './Txt';

/** Everything that doesn't fit on the card: prompts, the featured pick, badges and all interests. */
export function ProfileDetails({ card }: { card: Card }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 22 }}>
      {card.prompts.map((p) => (
        <View key={p.question} style={[styles.prompt, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
          <Txt variant="eyebrow" tone="muted">
            {p.question}
          </Txt>
          <Txt style={styles.answer}>{p.answer}</Txt>
        </View>
      ))}
      {card.featured ? <FeaturedRow item={card.featured} palette={card.palette} /> : null}
      {card.badges.length ? (
        <View style={{ gap: 10 }}>
          <Txt variant="eyebrow" tone="muted" style={{ marginLeft: 4 }}>
            Badges
          </Txt>
          <BadgeList ids={card.badges} />
        </View>
      ) : null}
      {card.interests.length ? (
        <View style={{ gap: 10 }}>
          <Txt variant="eyebrow" tone="muted" style={{ marginLeft: 4 }}>
            Into
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {card.interests.map((i) => (
              <Chip key={i} label={i} selected={card.sharedInterests.includes(i)} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** A full-height sheet with the card on top and the rest of the profile below it. */
export function ProfileSheet({ card, onClose }: { card: Card | null; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width - 40, 420);
  return (
    <Modal visible={!!card} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,7,10,0.5)' }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close profile" />
      </Animated.View>
      {card ? (
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          style={[styles.sheet, { backgroundColor: colors.bg, maxHeight: height - insets.top - 24, paddingBottom: insets.bottom }]}
        >
          <ScrollView contentContainerStyle={{ padding: 20, gap: 22, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
            <View style={[styles.grabber, { backgroundColor: colors.lineStrong }]} />
            <ProfileCard card={card} style={{ width: cardWidth, height: cardWidth * 1.3 }} />
            <View style={{ width: cardWidth }}>
              <ProfileDetails card={card} />
            </View>
          </ScrollView>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close" style={[styles.close, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
            <X size={18} color={colors.ink} />
          </Pressable>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  prompt: { borderRadius: radius.lg, padding: 18, gap: 8, borderWidth: StyleSheet.hairlineWidth },
  answer: { fontFamily: font.display, fontSize: 21, lineHeight: 28, letterSpacing: -0.3 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  grabber: { width: 40, height: 5, borderRadius: 3, marginBottom: 4 },
  close: { position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
