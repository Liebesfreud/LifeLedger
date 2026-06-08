import { Tabs } from 'expo-router';
import { BarChart3, Boxes, CreditCard, Settings } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '概览', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }} />
      <Tabs.Screen name="subscriptions" options={{ title: '订阅', tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} /> }} />
      <Tabs.Screen name="items" options={{ title: '物品', tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: '设置', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tabs>
  );
}
