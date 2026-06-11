import { Label as RnrLabel } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export function AppText({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn('text-base text-slate-700 dark:text-slate-300', className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<typeof RnrLabel>) {
  return <RnrLabel className={cn('text-sm font-semibold text-slate-700 dark:text-slate-300', className)} {...props} />;
}

export function Title({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn('text-lg font-black text-slate-950 dark:text-slate-50', className)} {...props} />;
}
