import { Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/metric-card';
import { Screen } from '@/components/ui/screen';
import { money } from '@/lib/utils';
import { selectDashboardData, useAppStore } from '@/store/app-store';

export default function DashboardScreen() {
  const state = useAppStore();
  const data = selectDashboardData(state);
  const recentSubscriptions = state.subscriptions.slice(0, 3);
  const idleItems = state.items
    .filter((item) => item.usageCount === 0 || item.condition === 'idle')
    .slice(0, 3);

  return (
    <Screen title="长期生活仪表盘" subtitle="订阅支出、资产使用和长期主义指数一屏掌握">
      <View className="mb-4 rounded-[32px] bg-slate-950 p-5">
        <Text className="text-sm font-semibold text-blue-200">Long-term Score</Text>
        <View className="mt-3 flex-row items-end justify-between">
          <Text className="text-6xl font-black text-white">{data.longTermScore}</Text>
          <Text className="mb-2 text-right text-sm leading-5 text-slate-300">越少闲置、越少无意识续费，分数越高</Text>
        </View>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-3">
        <MetricCard title="本月订阅" value={money(data.monthlySpend)} caption={`预算 ${money(state.settings.monthlyBudget)}`} tone="blue" />
        <MetricCard title="年度支出" value={money(data.annualSpend)} caption={`${state.subscriptions.length} 项订阅`} tone="amber" />
        <MetricCard title="物品总值" value={money(data.itemValue)} caption={`${state.items.length} 件物品`} tone="green" />
        <MetricCard title="需关注" value={`${data.dueSoon + data.idleItems}`} caption="续费/闲置提醒" tone="rose" />
      </View>

      <Card className="mb-4">
        <Text className="mb-3 text-lg font-black text-slate-950">即将处理的订阅</Text>
        {recentSubscriptions.length === 0 ? (
          <Text className="text-slate-500">还没有订阅，去添加第一个长期支出。</Text>
        ) : recentSubscriptions.map((sub) => (
          <View key={sub.id} className="mb-3 flex-row items-center justify-between last:mb-0">
            <View>
              <Text className="font-bold text-slate-900">{sub.icon || '💳'} {sub.name}</Text>
              <Text className="text-sm text-slate-500">下次扣款 {sub.nextPaymentDate}</Text>
            </View>
            <Text className="font-black text-slate-950">{money(sub.price, sub.currency)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text className="mb-3 text-lg font-black text-slate-950">闲置资产雷达</Text>
        {idleItems.length === 0 ? (
          <Text className="text-slate-500">目前没有明显闲置物品，继续保持。</Text>
        ) : idleItems.map((item) => (
          <View key={item.id} className="mb-3 flex-row items-center justify-between last:mb-0">
            <View>
              <Text className="font-bold text-slate-900">{item.name}</Text>
              <Text className="text-sm text-slate-500">{item.location} · 已使用 {item.usageCount} 次</Text>
            </View>
            <Text className="font-black text-slate-950">{money(item.purchasePrice, item.currency)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
