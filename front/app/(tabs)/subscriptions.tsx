import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/screen';
import { SubscriptionForm } from '@/components/entity-form';
import { cycleLabel, daysUntil, money, monthlyCost } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import type { Subscription } from '@/types/domain';

const statusLabel = {
  active: '使用中',
  paused: '已暂停',
  cancelled: '已取消',
};

export default function SubscriptionsScreen() {
  const subscriptions = useAppStore((state) => state.subscriptions);
  const categories = useAppStore((state) => state.categories.filter((category) => category.module === 'subscription'));
  const addSubscription = useAppStore((state) => state.addSubscription);
  const updateSubscription = useAppStore((state) => state.updateSubscription);
  const renewSubscription = useAppStore((state) => state.renewSubscription);
  const removeSubscription = useAppStore((state) => state.removeSubscription);
  const renewalLogs = useAppStore((state) => state.subscriptionRenewalLogs);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [editing, setEditing] = useState<Subscription | undefined>();

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const renewalMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const log of renewalLogs) {
      const logs = map.get(log.subscriptionId) ?? [];
      if (logs.length < 2) logs.push(log.paidAt);
      map.set(log.subscriptionId, logs);
    }
    return map;
  }, [renewalLogs]);

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return subscriptions.filter((subscription) => {
      const matchedQuery = !normalizedQuery || subscription.name.toLowerCase().includes(normalizedQuery) || subscription.description?.toLowerCase().includes(normalizedQuery);
      const matchedCategory = !categoryFilter || subscription.categoryId === categoryFilter;
      return matchedQuery && matchedCategory;
    });
  }, [categoryFilter, query, subscriptions]);

  const totalMonthly = useMemo(() => filteredSubscriptions.reduce((sum, sub) => sum + monthlyCost(sub.price, sub.billingCycle), 0), [filteredSubscriptions]);
  const categoryName = useCallback((id?: string) => (id ? categoryMap.get(id) : undefined) ?? '未分类', [categoryMap]);

  const submitEditing = useCallback(async (input: Omit<Subscription, 'id' | 'createdAt'>) => {
    if (!editing) return;
    await updateSubscription({ ...editing, ...input });
    setEditing(undefined);
  }, [editing, updateSubscription]);

  const renderSubscription = useCallback(({ item: sub }: { item: Subscription }) => {
    const days = daysUntil(sub.nextPaymentDate);
    const recentRenewals = renewalMap.get(sub.id)?.join('、');
    return (
      <Card className="mb-3">
        <View className="flex-row justify-between gap-4">
          <View className="flex-1">
            <Text className="text-xl font-black text-slate-950">{sub.icon || '💳'} {sub.name}</Text>
            <Text className="mt-1 text-slate-500">{cycleLabel[sub.billingCycle]} · {categoryName(sub.categoryId)} · 下次付款 {sub.nextPaymentDate}</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-black text-slate-950">{money(sub.price, sub.currency)}</Text>
            <Pill className={sub.status !== 'active' ? 'bg-slate-100 text-slate-600' : days <= sub.notifyDaysBefore ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}>
              {sub.status !== 'active' ? statusLabel[sub.status] : days < 0 ? `已过期 ${Math.abs(days)} 天` : `${days} 天后`}
            </Pill>
          </View>
        </View>
        <Text className="mt-3 text-sm text-slate-500">折算月支出 {money(monthlyCost(sub.price, sub.billingCycle), sub.currency)} · {sub.autoRenew ? '自动续费' : '手动确认'} · 提前 {sub.notifyDaysBefore} 天提醒</Text>
        <Text className="mt-2 text-sm text-slate-400">付款方式：{sub.paymentMethod || '未记录'}{recentRenewals ? ` · 最近续费 ${recentRenewals}` : ''}</Text>
        <View className="mt-4 flex-row gap-2">
          <Button size="sm" variant="default" onPress={() => renewSubscription(sub)}>已续费</Button>
          <Button size="sm" variant="secondary" onPress={() => setEditing(sub)}>编辑</Button>
          <Button
            size="sm"
            variant="destructive"
            onPress={() => Alert.alert('删除订阅', `确定删除 ${sub.name}？`, [
              { text: '取消', style: 'cancel' },
              { text: '删除', style: 'destructive', onPress: () => removeSubscription(sub.id) },
            ])}
          >
            删除
          </Button>
        </View>
      </Card>
    );
  }, [categoryName, removeSubscription, renewalMap, renewSubscription]);

  const listHeader = useMemo(() => (
    <View>
      <View className="mb-5">
        <Text className="text-3xl font-black text-slate-950">订阅管理</Text>
        <Text className="mt-1 text-base text-slate-500">筛选结果 {filteredSubscriptions.length} 项 · 月支出 {money(totalMonthly)}</Text>
      </View>
      {editing ? (
        <SubscriptionForm
          categories={categories}
          initialValue={editing}
          onCancel={() => setEditing(undefined)}
          onSubmit={submitEditing}
        />
      ) : (
        <SubscriptionForm categories={categories} onSubmit={addSubscription} />
      )}
      <Card className="mb-4 gap-3">
        <Input placeholder="搜索订阅名称或备注" value={query} onChangeText={setQuery} />
        <View className="flex-row flex-wrap gap-2">
          <Button size="sm" variant={!categoryFilter ? 'default' : 'secondary'} onPress={() => setCategoryFilter(undefined)}>全部</Button>
          {categories.map((category) => (
            <Button key={category.id} size="sm" variant={categoryFilter === category.id ? 'default' : 'secondary'} onPress={() => setCategoryFilter(category.id)}>
              {category.name}
            </Button>
          ))}
        </View>
      </Card>
    </View>
  ), [addSubscription, categories, categoryFilter, editing, filteredSubscriptions.length, query, submitEditing, totalMonthly]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscription}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-28 pt-4"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<Text className="text-center text-slate-500">没有匹配的订阅，调整筛选或新增一个。</Text>}
      />
    </SafeAreaView>
  );
}
