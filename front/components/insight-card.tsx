import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'green' | 'amber' | 'rose';

const toneStyles: Record<Tone, { badge: string; text: string; dot: string }> = {
  blue: { badge: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  green: { badge: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  amber: { badge: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  rose: { badge: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

export function ProgressBar({ value, tone = 'blue' }: { value: number; tone?: Tone }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <View className={cn('h-full rounded-full', toneStyles[tone].dot)} style={{ width: `${clamped}%` }} />
    </View>
  );
}

export function InsightCard({
  title,
  description,
  action,
  tone = 'blue',
  onPress,
}: {
  title: string;
  description: string;
  action: string;
  tone?: Tone;
  onPress: () => void;
}) {
  const styles = toneStyles[tone];
  return (
    <Pressable onPress={onPress} className="mb-3 active:opacity-80">
      <Card>
        <View className="flex-row items-start gap-3">
          <View className={cn('mt-1 h-3 w-3 rounded-full', styles.dot)} />
          <View className="flex-1">
            <Text className="text-base font-black text-slate-950 dark:text-slate-50">{title}</Text>
            <Text className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</Text>
            <View className={cn('mt-3 self-start rounded-full px-3 py-1', styles.badge)}>
              <Text className={cn('text-xs font-bold', styles.text)}>{action}</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </View>
      </Card>
    </Pressable>
  );
}
