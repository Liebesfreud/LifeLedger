import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BillingCycle, Currency, ItemCondition } from '@/types/domain';

const currencies: Currency[] = ['CNY', 'USD', 'EUR', 'GBP', 'JPY'];
const cycles: BillingCycle[] = ['monthly', 'yearly', 'quarterly', 'weekly'];
const conditions: ItemCondition[] = ['new', 'good', 'used', 'idle', 'retired'];

function ChoiceRow<T extends string>({ values, value, onChange }: { values: T[]; value: T; onChange: (value: T) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {values.map((item) => (
        <Button key={item} size="sm" variant={item === value ? 'default' : 'secondary'} onPress={() => onChange(item)}>
          {item}
        </Button>
      ))}
    </View>
  );
}

export function SubscriptionForm({ onSubmit }: { onSubmit: (input: { name: string; price: number; currency: Currency; billingCycle: BillingCycle; nextPaymentDate: string; notifyDaysBefore: number; icon: string; autoRenew: boolean }) => Promise<void> }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('CNY');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notifyDaysBefore, setNotifyDaysBefore] = useState('3');
  const [icon, setIcon] = useState('💳');

  const submit = async () => {
    if (!name.trim()) return Alert.alert('请填写订阅名称');
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return Alert.alert('请填写有效价格');
    await onSubmit({ name: name.trim(), price: parsedPrice, currency, billingCycle, nextPaymentDate, notifyDaysBefore: Number(notifyDaysBefore) || 0, icon, autoRenew: true });
    setName('');
    setPrice('');
  };

  return (
    <Card className="mb-4 gap-3">
      <Text className="text-lg font-black text-slate-950">新增订阅</Text>
      <Input placeholder="名称，例如 ChatGPT" value={name} onChangeText={setName} />
      <View className="flex-row gap-3">
        <Input className="flex-1" placeholder="价格" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
        <Input className="w-20" placeholder="图标" value={icon} onChangeText={setIcon} />
      </View>
      <ChoiceRow values={currencies} value={currency} onChange={setCurrency} />
      <ChoiceRow values={cycles} value={billingCycle} onChange={setBillingCycle} />
      <Input placeholder="下次付款日期 YYYY-MM-DD" value={nextPaymentDate} onChangeText={setNextPaymentDate} />
      <Input placeholder="提前提醒天数" keyboardType="number-pad" value={notifyDaysBefore} onChangeText={setNotifyDaysBefore} />
      <Button onPress={submit}>保存订阅</Button>
    </Card>
  );
}

export function ItemForm({ onSubmit, defaultIdleDays }: { defaultIdleDays: number; onSubmit: (input: { name: string; purchasePrice: number; currency: Currency; purchaseDate: string; location: string; condition: ItemCondition; idleAlertDays: number }) => Promise<void> }) {
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('CNY');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('家里');
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [idleAlertDays, setIdleAlertDays] = useState(String(defaultIdleDays));

  const submit = async () => {
    if (!name.trim()) return Alert.alert('请填写物品名称');
    const parsedPrice = Number(purchasePrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return Alert.alert('请填写有效购入价');
    await onSubmit({ name: name.trim(), purchasePrice: parsedPrice, currency, purchaseDate, location, condition, idleAlertDays: Number(idleAlertDays) || defaultIdleDays });
    setName('');
    setPurchasePrice('');
  };

  return (
    <Card className="mb-4 gap-3">
      <Text className="text-lg font-black text-slate-950">新增物品</Text>
      <Input placeholder="名称，例如 Kindle" value={name} onChangeText={setName} />
      <Input placeholder="购入价" keyboardType="decimal-pad" value={purchasePrice} onChangeText={setPurchasePrice} />
      <ChoiceRow values={currencies} value={currency} onChange={setCurrency} />
      <ChoiceRow values={conditions} value={condition} onChange={setCondition} />
      <Input placeholder="购入日期 YYYY-MM-DD" value={purchaseDate} onChangeText={setPurchaseDate} />
      <Input placeholder="存放位置" value={location} onChangeText={setLocation} />
      <Input placeholder="闲置提醒天数" keyboardType="number-pad" value={idleAlertDays} onChangeText={setIdleAlertDays} />
      <Button onPress={submit}>保存物品</Button>
    </Card>
  );
}
