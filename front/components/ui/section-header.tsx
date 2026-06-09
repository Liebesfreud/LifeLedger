import { Text, View } from 'react-native';
import { cn } from '@/lib/utils';

export function SectionHeader({ title, action, className }: { title: string; action?: React.ReactNode; className?: string }) {
  return (
    <View className={cn('mb-3 flex-row items-center justify-between', className)}>
      <Text className="text-lg font-black text-slate-950 dark:text-slate-50">{title}</Text>
      {action}
    </View>
  );
}
