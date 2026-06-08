import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export function Screen({ title, subtitle, children, right }: { title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-4">
        <View className="mb-5 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-3xl font-black text-slate-950 dark:text-slate-50">{title}</Text>
            {subtitle ? <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">{subtitle}</Text> : null}
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('overflow-hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300', className)}>{children}</Text>;
}
