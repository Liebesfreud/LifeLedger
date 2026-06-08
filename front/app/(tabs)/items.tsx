import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ItemForm } from '@/components/entity-form';
import { Pill } from '@/components/ui/screen';
import { EmptyState, Sheet } from '@/components/ui/sheet';
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
  const [expandedItemId, setExpandedItemId] = useState<string | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const usageTextMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const log of usageLogs) {
      const logs = map.get(log.itemId) ?? [];
      if (logs.length < 3) logs.push(log.usedAt);
      map.set(log.itemId, logs);
    }
    return new Map(Array.from(map.entries()).map(([itemId, logs]) => [itemId, logs.join('、')]));
  }, [usageLogs]);

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

  const totalValue = useMemo(() => filteredItems.reduce((sum, item) => sum + item.purchasePrice, 0), [filteredItems]);
  const categoryName = useCallback((id?: string) => (id ? categoryMap.get(id) : undefined) ?? '未分类', [categoryMap]);
  const recentUsageText = useCallback((itemId: string) => usageTextMap.get(itemId) ?? '', [usageTextMap]);
  const usageLogsByItem = useMemo(() => {
    const map = new Map<string, typeof usageLogs>();
    for (const log of usageLogs) {
      const logs = map.get(log.itemId) ?? [];
      logs.push(log);
      map.set(log.itemId, logs);
    }
    return map;
  }, [usageLogs]);

  const submitEditing = useCallback(async (input: Omit<Item, 'id' | 'createdAt'>) => {
    if (!editing) return;
    await updateItem({ ...editing, ...input });
    setEditing(undefined);
    setIsFormOpen(false);
  }, [editing, updateItem]);

  const submitCreating = useCallback(async (input: Omit<Item, 'id' | 'createdAt'>) => {
    await addItem(input);
    setIsFormOpen(false);
  }, [addItem]);

  const openCreateForm = useCallback(() => {
    setEditing(undefined);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((item: Item) => {
    setEditing(item);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditing(undefined);
    setIsFormOpen(false);
  }, []);

  const renderItem = useCallback(({ item }: { item: Item }) => {
    const reference = item.lastUsedAt || item.purchaseDate;
    const idleDays = Math.abs(Math.min(daysUntil(reference), 0));
    const costPerUse = item.usageCount > 0 ? item.purchasePrice / item.usageCount : item.purchasePrice;
    const recentLogs = recentUsageText(item.id);
    const isExpanded = expandedItemId === item.id;
    const fullLogs = usageLogsByItem.get(item.id) ?? [];
    return (
      <Card className="mb-3">
        {item.photoUri ? <Image source={{ uri: item.photoUri }} className="mb-3 h-40 w-full rounded-2xl bg-slate-100" resizeMode="cover" /> : null}
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
        <Text className="mt-2 text-sm text-slate-400">保修截止：{item.warrantyUntil || '未记录'} · 序列号：{item.serialNumber || '未记录'}</Text>
        {recentLogs ? <Text className="mt-2 text-sm text-emerald-600">最近使用：{recentLogs}</Text> : null}
        {item.note ? <Text className="mt-2 text-sm text-slate-400">备注：{item.note}</Text> : null}
        {isExpanded ? (
          <View className="mt-4 rounded-2xl bg-slate-50 p-3">
            <Text className="mb-2 font-black text-slate-900">完整使用历史</Text>
            {fullLogs.length === 0 ? (
              <Text className="text-sm text-slate-500">暂无使用记录。</Text>
            ) : fullLogs.map((log) => (
              <View key={log.id} className="mb-2 flex-row justify-between last:mb-0">
                <Text className="text-sm font-semibold text-slate-700">{log.usedAt}</Text>
                <Text className="text-sm text-emerald-600">+1 次</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View className="mt-4 flex-row gap-2">
          <Button size="sm" variant="secondary" onPress={() => markUsed(item)}>记录使用</Button>
          <Button size="sm" variant="secondary" onPress={() => setExpandedItemId((value) => value === item.id ? undefined : item.id)}>{isExpanded ? '收起' : '详情'}</Button>
          <Button size="sm" variant="secondary" onPress={() => openEditForm(item)}>编辑</Button>
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
  }, [categoryName, expandedItemId, markUsed, openEditForm, recentUsageText, removeItem, usageLogsByItem]);

  const listHeader = useMemo(() => (
    <View>
      <View className="mb-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-3xl font-black text-slate-950">物品管理</Text>
            <Text className="mt-1 text-base text-slate-500">筛选结果 {filteredItems.length} 件 · 总投入 {money(totalValue)}</Text>
          </View>
          <Button size="sm" onPress={openCreateForm}>新增</Button>
        </View>
      </View>
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
  ), [categories, categoryFilter, filteredItems.length, onlyIdle, openCreateForm, query, totalValue]);

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
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<EmptyState title="没有匹配的物品" description="调整筛选条件，或点击右上角新增一件需要长期追踪的物品。" />}
      />
      <Sheet
        visible={isFormOpen}
        title={editing ? '编辑物品' : '新增物品'}
        subtitle="记录价格、位置、照片、保修和真实使用成本。"
        onClose={closeForm}
      >
        <ItemForm
          categories={categories}
          defaultIdleDays={settings.itemIdleAlertDays}
          initialValue={editing}
          onCancel={closeForm}
          onSubmit={editing ? submitEditing : submitCreating}
        />
      </Sheet>
    </SafeAreaView>
  );
}
