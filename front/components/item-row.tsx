import { memo } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/screen';
import { daysUntil, money } from '@/lib/utils';
import type { Item, ItemUsageLog } from '@/types/domain';

function ItemRowComponent({
  item,
  categoryName,
  recentUsageText,
  fullLogs,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onMarkUsed,
  onRemove,
}: {
  item: Item;
  categoryName: string;
  recentUsageText: string;
  fullLogs: ItemUsageLog[];
  isExpanded: boolean;
  onToggleExpanded: (itemId: string) => void;
  onEdit: (item: Item) => void;
  onMarkUsed: (item: Item) => void;
  onRemove: (itemId: string) => void;
}) {
  const reference = item.lastUsedAt || item.purchaseDate;
  const idleDays = Math.abs(Math.min(daysUntil(reference), 0));
  const costPerUse = item.usageCount > 0 ? item.purchasePrice / item.usageCount : item.purchasePrice;

  return (
    <Card className="mb-3">
      {item.photoUri ? <Image source={{ uri: item.photoUri }} className="mb-3 h-40 w-full rounded-2xl bg-slate-100 dark:bg-slate-800" resizeMode="cover" /> : null}
      <View className="flex-row justify-between gap-4">
        <View className="flex-1">
          <Text className="text-xl font-black text-slate-950 dark:text-slate-50">{item.name}</Text>
          <Text className="mt-1 text-slate-500 dark:text-slate-400">{categoryName} · {item.location} · {item.condition} · 使用 {item.usageCount} 次</Text>
        </View>
        <View className="items-end">
          <Text className="text-lg font-black text-slate-950 dark:text-slate-50">{money(item.purchasePrice, item.currency)}</Text>
          <Pill className={idleDays >= item.idleAlertDays ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'}>
            闲置 {idleDays} 天
          </Pill>
        </View>
      </View>
      <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">单次使用成本约 {money(costPerUse, item.currency)} · 上次使用 {item.lastUsedAt || '未记录'}</Text>
      <Text className="mt-2 text-sm text-slate-400 dark:text-slate-500">保修截止：{item.warrantyUntil || '未记录'} · 序列号：{item.serialNumber || '未记录'}</Text>
      {recentUsageText ? <Text className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">最近使用：{recentUsageText}</Text> : null}
      {item.note ? <Text className="mt-2 text-sm text-slate-400 dark:text-slate-500">备注：{item.note}</Text> : null}
      {isExpanded ? (
        <View className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
          <Text className="mb-2 font-black text-slate-900 dark:text-slate-50">完整使用历史</Text>
          {fullLogs.length === 0 ? (
            <Text className="text-sm text-slate-500 dark:text-slate-400">暂无使用记录。</Text>
          ) : fullLogs.map((log) => (
            <View key={log.id} className="mb-2 flex-row justify-between last:mb-0">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">{log.usedAt}</Text>
              <Text className="text-sm text-emerald-600 dark:text-emerald-300">+1 次</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View className="mt-4 flex-row gap-2">
        <Button size="sm" variant="secondary" onPress={() => onMarkUsed(item)}>记录使用</Button>
        <Button size="sm" variant="secondary" onPress={() => onToggleExpanded(item.id)}>{isExpanded ? '收起' : '详情'}</Button>
        <Button size="sm" variant="secondary" onPress={() => onEdit(item)}>编辑</Button>
        <Button
          size="sm"
          variant="destructive"
          onPress={() => Alert.alert('删除物品', `确定删除 ${item.name}？`, [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: () => onRemove(item.id) },
          ])}
        >
          删除
        </Button>
      </View>
    </Card>
  );
}

export const ItemRow = memo(ItemRowComponent);
