import { Tabs } from 'expo-router/js-tabs';
import { useWindowDimensions } from 'react-native';
import { TabBar } from '@/components/TabBar';
import { useTheme } from '@/theme/ThemeProvider';
import { WIDE } from '@/theme/tokens';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const wide = width >= WIDE;
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} wide={wide} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: colors.bg },
        animation: 'shift',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover' }} />
      <Tabs.Screen name="chats" options={{ title: 'Friends' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
    </Tabs>
  );
}
