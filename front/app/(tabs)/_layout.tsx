import { Tabs } from 'expo-router';
import { BarChart3, Boxes, CreditCard, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
          borderRadius: 28,
          backgroundColor: isDark ? '#020617' : '#FFFFFF',
          shadowColor: '#0F172A',
          shadowOpacity: isDark ? 0.3 : 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarItemStyle: { borderRadius: 22, marginHorizontal: 4 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '概览', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }} />
      <Tabs.Screen name="subscriptions" options={{ title: '订阅', tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} /> }} />
      <Tabs.Screen name="items" options={{ title: '物品', tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: '设置', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tabs>
  );
}
