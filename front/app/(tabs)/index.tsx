import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/metric-card';
import { InsightCard, ProgressBar } from '@/components/insight-card';
import { Screen } from '@/components/ui/screen';
import { daysUntil, money } from '@/lib/utils';
import { selectDashboardData, useAppStore } from '@/store/app-store';

export default function DashboardScreen() {
  const state = useAppStore();
  const data = selectDashboardData(state);
  const budgetUsage = state.settings.monthlyBudget > 0 ? data.monthlySpend / state.settings.monthlyBudget * 100 : 0;

  const dueSubscriptions = useMemo(() => state.subscriptions
    .filter((sub) => sub.status === 'active')
    .sort((left, right) => daysUntil(left.nextPaymentDate) - daysUntil(right.nextPaymentDate))
    .slice(0, 3), [state.subscriptions]);

  const idleItems = useMemo(() => state.items
    .map((item) => ({ item, idleDays: Math.abs(Math.min(daysUntil(item.lastUsedAt || item.purchaseDate), 0)) }))
    .sort((left, right) => right.idleDays - left.idleDays)
    .slice(0, 3), [state.items]);

  const recentUsageLogs = state.itemUsageLogs.slice(0, 4);
  const itemName = (id: string) => state.items.find((item) => item.id === id)?.name ?? '未知物品';

  const insights = useMemo(() => {
    const result: Array<{ title: string; description: string; action: string; tone: 'blue' | 'green' | 'amber' | 'rose'; route: '/subscriptions' | '/items' | '/settings' }> = [];
    if (budgetUsage >= 100) {
      result.push({ title: '订阅预算已超额', description: `当前月化订阅约 ${money(data.monthlySpend)}，已经超过预算 ${money(state.settings.monthlyBudget)}。`, action: '检查订阅', tone: 'rose', route: '/subscriptions' });
    } else if (budgetUsage >= 80) {
      result.push({ title: '订阅预算接近上限', description: `预算使用率 ${Math.round(budgetUsage)}%，建议确认近期是否有可暂停服务。`, action: '查看订阅', tone: 'amber', route: '/subscriptions' });
    }
    if (data.dueSoon > 0) {
      result.push({ title: '有订阅即将续费', description: `${data.dueSoon} 项订阅已进入提醒窗口，适合续费前再确认一次价值。`, action: '处理续费', tone: 'blue', route: '/subscriptions' });
    }
    if (data.idleItems > 0) {
      result.push({ title: '发现闲置物品', description: `${data.idleItems} 件物品超过闲置提醒天数，考虑使用、转赠或出售。`, action: '查看物品', tone: 'rose', route: '/items' });
    }
    if (result.length === 0) {
      result.push({ title: '状态健康', description: '订阅支出和物品使用都处在较稳定状态，继续记录真实使用。', action: '继续记录', tone: 'green', route: '/items' });
    }
    return result.slice(0, 3);
  }, [budgetUsage, data.dueSoon, data.idleItems, data.monthlySpend, state.settings.monthlyBudget]);

  return (
    <Screen title="长期生活仪表盘" subtitle="订阅支出、资产使用和长期主义指数一屏掌握">
      <View className="mb-4 rounded-[32px] bg-slate-950 p-5">
        <Text className="text-sm font-semibold text-blue-200">Long-term Score</Text>
        <View className="mt-3 flex-row items-end justify-between">
          <Text className="text-6xl font-black text-white">{data.longTermScore}</Text>
          <Text className="mb-2 text-right text-sm leading-5 text-slate-300">预算克制、少闲置、多记录，分数越高</Text>
        </View>
        <View className="mt-5 rounded-3xl bg-white/10 p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-bold text-white">订阅预算使用率</Text>
            <Text className="font-black text-white">{Math.round(budgetUsage)}%</Text>
          </View>
          <ProgressBar value={budgetUsage} tone={budgetUsage >= 100 ? 'rose' : budgetUsage >= 80 ? 'amber' : 'green'} />
          <Text className="mt-2 text-xs text-slate-300">{money(data.monthlySpend)} / {money(state.settings.monthlyBudget)}</Text>
        </View>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-3">
        <MetricCard title="本月订阅" value={money(data.monthlySpend)} caption={`预算 ${money(state.settings.monthlyBudget)}`} tone={budgetUsage >= 100 ? 'rose' : 'blue'} />
        <MetricCard title="年度支出" value={money(data.annualSpend)} caption={`${state.subscriptions.length} 项订阅`} tone="amber" />
        <MetricCard title="物品总值" value={money(data.itemValue)} caption={`${state.items.length} 件物品`} tone="green" />
        <MetricCard title="本月使用" value={`${data.usedThisMonth}`} caption="记录的真实使用" tone="green" />
        <MetricCard title="需关注" value={`${data.dueSoon + data.idleItems}`} caption="续费/闲置提醒" tone="rose" />
      </View>

      <View className="mb-1">
        <Text className="mb-3 text-lg font-black text-slate-950">今日洞察</Text>
        {insights.map((insight) => (
          <InsightCard
            key={insight.title}
            title={insight.title}
            description={insight.description}
            action={insight.action}
            tone={insight.tone}
            onPress={() => router.push(insight.route)}
          />
        ))}
      </View>

      <Pressable onPress={() => router.push('/subscriptions')} className="active:opacity-80">
        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-950">即将处理的订阅</Text>
            <Text className="text-sm font-bold text-blue-600">查看全部</Text>
          </View>
          {dueSubscriptions.length === 0 ? (
            <Text className="text-slate-500">还没有订阅，去添加第一个长期支出。</Text>
          ) : dueSubscriptions.map((sub) => (
            <View key={sub.id} className="mb-3 flex-row items-center justify-between last:mb-0">
              <View>
                <Text className="font-bold text-slate-900">{sub.icon || '💳'} {sub.name}</Text>
                <Text className="text-sm text-slate-500">{daysUntil(sub.nextPaymentDate)} 天后 · {sub.nextPaymentDate}</Text>
              </View>
              <Text className="font-black text-slate-950">{money(sub.price, sub.currency)}</Text>
            </View>
          ))}
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/items')} className="active:opacity-80">
        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-950">闲置资产雷达</Text>
            <Text className="text-sm font-bold text-blue-600">查看全部</Text>
          </View>
          {idleItems.length === 0 ? (
            <Text className="text-slate-500">目前没有明显闲置物品，继续保持。</Text>
          ) : idleItems.map(({ item, idleDays }) => (
            <View key={item.id} className="mb-3 flex-row items-center justify-between last:mb-0">
              <View>
                <Text className="font-bold text-slate-900">{item.name}</Text>
                <Text className="text-sm text-slate-500">{item.location} · 闲置 {idleDays} 天 · 已使用 {item.usageCount} 次</Text>
              </View>
              <Text className="font-black text-slate-950">{money(item.purchasePrice, item.currency)}</Text>
            </View>
          ))}
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/items')} className="active:opacity-80">
        <Card>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-950">最近使用记录</Text>
            <Text className="text-sm font-bold text-blue-600">去记录</Text>
          </View>
          {recentUsageLogs.length === 0 ? (
            <Text className="text-slate-500">还没有使用记录，去物品页点一次“记录使用”。</Text>
          ) : recentUsageLogs.map((log) => (
            <View key={log.id} className="mb-3 flex-row items-center justify-between last:mb-0">
              <View>
                <Text className="font-bold text-slate-900">{itemName(log.itemId)}</Text>
                <Text className="text-sm text-slate-500">使用日期 {log.usedAt}</Text>
              </View>
              <Text className="font-black text-emerald-600">+1</Text>
            </View>
          ))}
        </Card>
      </Pressable>
    </Screen>
  );
}
