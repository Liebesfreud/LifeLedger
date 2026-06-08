import { useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ItemForm } from '@/components/entity-form';
import { Pill } from '@/components/ui/screen';
import { daysUntil, money } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import type { Item } from '@/types/domain';

export default function ItemsScreen() {
  const items = useAppStore((state) => state.items);
  const usageLogs = useAppStore((state) => state.itemUsageLogs);
  const categories = useAppStore((state) => state.categories.filter((category) => category.module === 'item'));
  const settings = useAppStore((state) => state.settings);
  const addItem = useAppStore((state) => state.addItem);
  const updateItem = useAppStore((state) => state.updateItem);
  const removeItem = useAppStore((state) => state.removeItem);
  const markUsed = useAppStore((state) => state.markUsed);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [onlyIdle, setOnlyIdle] = useState(false);
  const [editing, setEditing] = useState<Item | undefined>();

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const reference = item.lastUsedAt || item.purchaseDate;
      const idleDays = Math.abs(Math.min(daysUntil(reference), 0));
      const matchedQuery = !normalizedQuery || item.name.toLowerCase().includes(normalizedQuery) || item.location.toLowerCase().includes(normalizedQuery) || item.note?.toLowerCase().includes(normalizedQuery);
      const matchedCategory = !categoryFilter || item.categoryId === categoryFilter;
      const matchedIdle = !onlyIdle || idleDays >= item.idleAlertDays || item.condition === 'idle';
      return matchedQuery && matchedCategory && matchedIdle;
    });
  }, [categoryFilter, items, onlyIdle, query]);

  const totalValue = filteredItems.reduce((sum, item) => sum + item.purchasePrice, 0);
  const categoryName = (id?: string) => categories.find((category) => category.id === id)?.name ?? '未分类';
  const recentUsageText = (itemId: string) => usageLogs.filter((log) => log.itemId === itemId).slice(0, 3).map((log) => log.usedAt).join('、');

  const renderItem = ({ item }: { item: Item }) => {
    const reference = item.lastUsedAt || item.purchaseDate;
    const idleDays = Math.abs(Math.min(daysUntil(reference), 0));
    const costPerUse = item.usageCount > 0 ? item.purchasePrice / item.usageCount : item.purchasePrice;
    const recentLogs = recentUsageText(item.id);
    return (
      <Card className="mb-3">
        <View className="flex-row justify-between gap-4">
          <View className="flex-1">
            <Text className="text-xl font-black text-slate-950">{item.name}</Text>
            <Text className="mt-1 text-slate-500">{categoryName(item.categoryId)} · {item.location} · {item.condition} · 使用 {item.usageCount} 次</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-black text-slate-950">{money(item.purchasePrice, item.currency)}</Text>
            <Pill className={idleDays >= item.idleAlertDays ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}>
              闲置 {idleDays} 天
            </Pill>
          </View>
        </View>
        <Text className="mt-3 text-sm text-slate-500">单次使用成本约 {money(costPerUse, item.currency)} · 上次使用 {item.lastUsedAt || '未记录'}</Text>
        {recentLogs ? <Text className="mt-2 text-sm text-emerald-600">最近使用：{recentLogs}</Text> : null}
        {item.note ? <Text className="mt-2 text-sm text-slate-400">备注：{item.note}</Text> : null}
        <View className="mt-4 flex-row gap-2">
          <Button size="sm" variant="secondary" onPress={() => markUsed(item)}>记录使用</Button>
          <Button size="sm" variant="secondary" onPress={() => setEditing(item)}>编辑</Button>
          <Button
            size="sm"
            variant="destructive"
            onPress={() => Alert.alert('删除物品', `确定删除 ${item.name}？`, [
              { text: '取消', style: 'cancel' },
              { text: '删除', style: 'destructive', onPress: () => removeItem(item.id) },
            ])}
          >
            删除
          </Button>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-28 pt-4"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={(
          <View>
            <View className="mb-5">
              <Text className="text-3xl font-black text-slate-950">物品管理</Text>
              <Text className="mt-1 text-base text-slate-500">筛选结果 {filteredItems.length} 件 · 总投入 {money(totalValue)}</Text>
            </View>
            {editing ? (
              <ItemForm
                categories={categories}
                defaultIdleDays={settings.itemIdleAlertDays}
                initialValue={editing}
                onCancel={() => setEditing(undefined)}
                onSubmit={async (input) => {
                  await updateItem({ ...editing, ...input });
                  setEditing(undefined);
                }}
              />
            ) : (
              <ItemForm categories={categories} defaultIdleDays={settings.itemIdleAlertDays} onSubmit={addItem} />
            )}
            <Card className="mb-4 gap-3">
              <Input placeholder="搜索物品、位置或备注" value={query} onChangeText={setQuery} />
              <View className="flex-row flex-wrap gap-2">
                <Button size="sm" variant={!categoryFilter ? 'default' : 'secondary'} onPress={() => setCategoryFilter(undefined)}>全部</Button>
                {categories.map((category) => (
                  <Button key={category.id} size="sm" variant={categoryFilter === category.id ? 'default' : 'secondary'} onPress={() => setCategoryFilter(category.id)}>
                    {category.name}
                  </Button>
                ))}
                <Button size="sm" variant={onlyIdle ? 'default' : 'secondary'} onPress={() => setOnlyIdle((value) => !value)}>只看闲置</Button>
              </View>
            </Card>
          </View>
        )}
        ListEmptyComponent={<Text className="text-center text-slate-500">没有匹配的物品，调整筛选或新增一件。</Text>}
      />
    </SafeAreaView>
  );
}
