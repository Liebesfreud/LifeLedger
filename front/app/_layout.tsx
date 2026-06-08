import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/app-store';

export default function RootLayout() {
  const initialize = useAppStore((state) => state.initialize);
  const ready = useAppStore((state) => state.ready);

  useEffect(() => {
    initialize().catch((error) => console.error('App init failed', error));
  }, [initialize]);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator color="#2563EB" size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
