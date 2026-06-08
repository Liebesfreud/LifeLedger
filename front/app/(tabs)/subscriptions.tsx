import { Alert, Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, Screen } from '@/components/ui/screen';
import { SubscriptionForm } from '@/components/entity-form';
import { cycleLabel, daysUntil, money, monthlyCost } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

export default function SubscriptionsScreen() {
  const subscriptions = useAppStore((state) => state.subscriptions);
  const addSubscription = useAppStore((state) => state.addSubscription);
  const removeSubscription = useAppStore((state) => state.removeSubscription);
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + monthlyCost(sub.price, sub.billingCycle), 0);

  return (
    <Screen title="订阅管理" subtitle={`本月预计支出 ${money(totalMonthly)} · ${subscriptions.length} 项长期扣款`}>
      <SubscriptionForm onSubmit={addSubscription} />
      {subscriptions.map((sub) => {
        const days = daysUntil(sub.nextPaymentDate);
        return (
          <Card key={sub.id} className="mb-3">
            <View className="flex-row justify-between gap-4">
              <View className="flex-1">
                <Text className="text-xl font-black text-slate-950">{sub.icon || '💳'} {sub.name}</Text>
                <Text className="mt-1 text-slate-500">{cycleLabel[sub.billingCycle]} · 下次付款 {sub.nextPaymentDate}</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-black text-slate-950">{money(sub.price, sub.currency)}</Text>
                <Pill className={days <= sub.notifyDaysBefore ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}>
                  {days < 0 ? `已过期 ${Math.abs(days)} 天` : `${days} 天后`}
                </Pill>
              </View>
            </View>
            <View className="mt-4 flex-row gap-2">
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
      {subscriptions.length === 0 ? <Text className="text-center text-slate-500">暂无订阅，先添加一个吧。</Text> : null}
    </Screen>
  );
}
