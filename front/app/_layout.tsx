import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useAppStore } from '@/store/app-store';

export default function RootLayout() {
  const initialize = useAppStore((state) => state.initialize);
  const ready = useAppStore((state) => state.ready);
  const themeMode = useAppStore((state) => state.settings.themeMode);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    initialize().catch((error) => console.error('App init failed', error));
  }, [initialize]);

  useEffect(() => {
    setColorScheme(themeMode);
  }, [setColorScheme, themeMode]);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
          <ActivityIndicator color="#2563EB" size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
