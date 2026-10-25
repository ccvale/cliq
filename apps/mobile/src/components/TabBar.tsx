import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Compass, MessageCircle, UserRound } from 'lucide-react-native';
import { useMatches } from '@/state/matches';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Avatar } from './Avatar';
import { Txt } from './Txt';
import { Wordmark } from './Wordmark';

const ICONS = { index: Compass, chats: MessageCircle, profile: UserRound } as const;

function Item({ name, label, focused, onPress, wide, badge }: { name: keyof typeof ICONS; label: string; focused: boolean; onPress: () => void; wide: boolean; badge: number }) {
  const { colors, accent } = useTheme();
  const Icon = ICONS[name];
  const pill = useAnimatedStyle(() => ({
    opacity: withSpring(focused ? 1 : 0, { damping: 20 }),
    transform: [{ scale: withSpring(focused ? 1 : 0.85, { damping: 16 }) }],
  }));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
      style={wide ? styles.sideItem : styles.item}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.pill, { backgroundColor: colors.bgSunken }, pill]} />
      <View>
        <Icon size={22} color={focused ? accent.solid : colors.muted} strokeWidth={focused ? 2.4 : 2} />
        {badge > 0 ? (
          <View style={[styles.badge, { backgroundColor: accent.to, borderColor: colors.bgRaised }]}>
            <Txt variant="caption" style={{ color: '#fff', fontSize: 10, lineHeight: 12 }}>
              {badge > 9 ? '9+' : badge}
            </Txt>
          </View>
        ) : null}
      </View>
      <Txt variant={wide ? 'heading' : 'caption'} style={{ color: focused ? colors.ink : colors.muted }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Floating glass bar on phones; a quiet sidebar on wide web windows. */
export function TabBar({ state, descriptors, emitter, navigateToTab, wide }: BottomTabBarProps & { wide: boolean }) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const { unreadTotal } = useMatches();
  const { me } = useSession();

  const items = state.routes.map((route, i) => (
    <Item
      key={route.key}
      name={route.name as keyof typeof ICONS}
      label={String(descriptors[route.key]!.options.title)}
      focused={state.index === i}
      wide={wide}
      badge={route.name === 'chats' ? unreadTotal : 0}
      onPress={() => {
        const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (state.index !== i && !event.defaultPrevented) {
          if (Platform.OS !== 'web') void Haptics.selectionAsync();
          navigateToTab(route.key);
        }
      }}
    />
  ));

  if (wide) {
    return (
      <View style={[styles.sidebar, { backgroundColor: colors.bg, borderRightColor: colors.line, paddingTop: insets.top + 28 }]}>
        <View style={{ paddingHorizontal: 12, marginBottom: 36 }}>
          <Wordmark size={34} />
        </View>
        <View style={{ gap: 4 }}>{items}</View>
        <View style={{ flex: 1 }} />
        {me ? (
          <View style={styles.sideFooter}>
            <Avatar name={me.profile.displayName} palette={me.profile.palette} size={36} />
            <View style={{ flex: 1 }}>
              <Txt variant="label" numberOfLines={1}>
                {me.profile.displayName}
              </Txt>
              <Txt variant="caption" tone="muted" numberOfLines={1}>
                {me.profile.city}
              </Txt>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.floatWrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <BlurView intensity={60} tint={scheme === 'dark' ? 'dark' : 'light'} style={[styles.float, { borderColor: colors.line, backgroundColor: colors.glass }]}>
        {items}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  float: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 6,
    gap: 4,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  item: { alignItems: 'center', justifyContent: 'center', gap: 3, width: 84, height: 56 },
  pill: { borderRadius: radius.pill },
  sidebar: { width: 248, paddingHorizontal: 16, paddingBottom: 24, borderRightWidth: StyleSheet.hairlineWidth },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 48, paddingHorizontal: 14 },
  sideFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
