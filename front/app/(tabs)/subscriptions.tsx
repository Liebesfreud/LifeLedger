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

export default function SubscriptionsScreen() {
  const subscriptions = useAppStore((state) => state.subscriptions);
  const categories = useAppStore((state) => state.categories.filter((category) => category.module === 'subscription'));
  const addSubscription = useAppStore((state) => state.addSubscription);
  const updateSubscription = useAppStore((state) => state.updateSubscription);
  const removeSubscription = useAppStore((state) => state.removeSubscription);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [editing, setEditing] = useState<Subscription | undefined>();

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

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
    return (
      <Card className="mb-3">
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
  }, [categoryName, removeSubscription]);

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
