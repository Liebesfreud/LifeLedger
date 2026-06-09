import { Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const tones = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
};

export function MetricCard({ title, value, caption, tone = 'blue' }: { title: string; value: string; caption: string; tone?: keyof typeof tones }) {
  return (
    <Card className="flex-1 min-w-[46%]">
      <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</Text>
      <Text className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">{value}</Text>
      <View className={cn('mt-3 self-start rounded-full px-3 py-1', tones[tone].split(' ')[0])}>
        <Text className={cn('text-xs font-semibold', tones[tone].split(' ')[1])}>{caption}</Text>
      </View>
    </Card>
  );
}
