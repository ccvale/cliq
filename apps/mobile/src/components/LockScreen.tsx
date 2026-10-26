import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Txt } from './Txt';
import { Wordmark } from './Wordmark';

/** Covers the app until Face ID / fingerprint succeeds. */
export function LockScreen() {
  const { unlock } = useSession();
  const { colors, scheme } = useTheme();
  useEffect(() => {
    void unlock();
  }, []);
  return (
    <BlurView intensity={80} tint={scheme} style={[StyleSheet.absoluteFill, styles.center]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, opacity: 0.6 }]} />
      <Wordmark size={44} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <Lock size={16} color={colors.muted} />
        <Txt tone="muted">Cliq is locked</Txt>
      </View>
      <Button label="Unlock" onPress={unlock} style={{ marginTop: 32, width: 220 }} />
    </BlurView>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
