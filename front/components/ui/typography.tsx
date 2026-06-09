import { Text, type TextProps } from 'react-native';
import { cn } from '@/lib/utils';

export function AppText({ className, ...props }: TextProps) {
  return <Text className={cn('text-base text-slate-700 dark:text-slate-300', className)} {...props} />;
}

export function Label({ className, ...props }: TextProps) {
  return <Text className={cn('text-sm font-semibold text-slate-700 dark:text-slate-300', className)} {...props} />;
}

export function Title({ className, ...props }: TextProps) {
  return <Text className={cn('text-lg font-black text-slate-950 dark:text-slate-50', className)} {...props} />;
}
