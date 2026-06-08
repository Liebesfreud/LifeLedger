import { Alert, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ItemForm } from '@/components/entity-form';
import { Pill, Screen } from '@/components/ui/screen';
import { daysUntil, money } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

export default function ItemsScreen() {
  const items = useAppStore((state) => state.items);
  const settings = useAppStore((state) => state.settings);
  const addItem = useAppStore((state) => state.addItem);
  const removeItem = useAppStore((state) => state.removeItem);
  const markUsed = useAppStore((state) => state.markUsed);
  const totalValue = items.reduce((sum, item) => sum + item.purchasePrice, 0);

  return (
    <Screen title="物品管理" subtitle={`管理 ${items.length} 件物品 · 总投入 ${money(totalValue)}`}>
      <ItemForm defaultIdleDays={settings.itemIdleAlertDays} onSubmit={addItem} />
      {items.map((item) => {
        const reference = item.lastUsedAt || item.purchaseDate;
        const idleDays = Math.abs(Math.min(daysUntil(reference), 0));
        const costPerUse = item.usageCount > 0 ? item.purchasePrice / item.usageCount : item.purchasePrice;
        return (
          <Card key={item.id} className="mb-3">
            <View className="flex-row justify-between gap-4">
              <View className="flex-1">
                <Text className="text-xl font-black text-slate-950">{item.name}</Text>
                <Text className="mt-1 text-slate-500">{item.location} · {item.condition} · 使用 {item.usageCount} 次</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-black text-slate-950">{money(item.purchasePrice, item.currency)}</Text>
                <Pill className={idleDays >= item.idleAlertDays ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}>
                  闲置 {idleDays} 天
                </Pill>
              </View>
            </View>
            <Text className="mt-3 text-sm text-slate-500">单次使用成本约 {money(costPerUse, item.currency)} · 上次使用 {item.lastUsedAt || '未记录'}</Text>
            <View className="mt-4 flex-row gap-2">
              <Button size="sm" variant="secondary" onPress={() => markUsed(item)}>记录使用</Button>
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
      })}
      {items.length === 0 ? <Text className="text-center text-slate-500">暂无物品，记录一次真实拥有。</Text> : null}
    </Screen>
  );
}
