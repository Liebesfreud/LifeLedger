import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pill, Screen } from '@/components/ui/screen';
import { SubscriptionForm } from '@/components/entity-form';
import { cycleLabel, daysUntil, money, monthlyCost } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import type { Subscription } from '@/types/domain';

export default function SubscriptionsScreen() {
  const subscriptions = useAppStore((state) => state.subscriptions);
  const categories = useAppStore((state) => state.categories.filter((category) => category.module === 'subscription'));
  const addSubscription = useAppStore((state) => state.addSubscription);
  const updateSubscription = useAppStore((state) => state.updateSubscription);
  const removeSubscription = useAppStore((state) => state.removeSubscription);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [editing, setEditing] = useState<Subscription | undefined>();

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return subscriptions.filter((subscription) => {
      const matchedQuery = !normalizedQuery || subscription.name.toLowerCase().includes(normalizedQuery) || subscription.description?.toLowerCase().includes(normalizedQuery);
      const matchedCategory = !categoryFilter || subscription.categoryId === categoryFilter;
      return matchedQuery && matchedCategory;
    });
  }, [categoryFilter, query, subscriptions]);

  const totalMonthly = filteredSubscriptions.reduce((sum, sub) => sum + monthlyCost(sub.price, sub.billingCycle), 0);
  const categoryName = (id?: string) => categories.find((category) => category.id === id)?.name ?? '未分类';

  return (
    <Screen title="订阅管理" subtitle={`筛选结果 ${filteredSubscriptions.length} 项 · 月支出 ${money(totalMonthly)}`}>
      {editing ? (
        <SubscriptionForm
          categories={categories}
          initialValue={editing}
          onCancel={() => setEditing(undefined)}
          onSubmit={async (input) => {
            await updateSubscription({ ...editing, ...input });
            setEditing(undefined);
          }}
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

      {filteredSubscriptions.map((sub) => {
        const days = daysUntil(sub.nextPaymentDate);
        return (
          <Card key={sub.id} className="mb-3">
            <View className="flex-row justify-between gap-4">
              <View className="flex-1">
                <Text className="text-xl font-black text-slate-950">{sub.icon || '💳'} {sub.name}</Text>
                <Text className="mt-1 text-slate-500">{cycleLabel[sub.billingCycle]} · {categoryName(sub.categoryId)} · 下次付款 {sub.nextPaymentDate}</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-black text-slate-950">{money(sub.price, sub.currency)}</Text>
                <Pill className={days <= sub.notifyDaysBefore ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}>
                  {days < 0 ? `已过期 ${Math.abs(days)} 天` : `${days} 天后`}
                </Pill>
              </View>
            </View>
            <Text className="mt-3 text-sm text-slate-500">折算月支出 {money(monthlyCost(sub.price, sub.billingCycle), sub.currency)} · 提前 {sub.notifyDaysBefore} 天提醒</Text>
            <View className="mt-4 flex-row gap-2">
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
      })}
      {filteredSubscriptions.length === 0 ? <Text className="text-center text-slate-500">没有匹配的订阅，调整筛选或新增一个。</Text> : null}
    </Screen>
  );
}
