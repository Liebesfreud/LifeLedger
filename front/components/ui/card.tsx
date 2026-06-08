import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ViewProps) {
  return <View className={cn('rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200', className)} {...props} />;
}
