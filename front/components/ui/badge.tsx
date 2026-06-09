import { Text, type TextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('overflow-hidden rounded-full px-3 py-1 text-xs font-bold', {
  variants: {
    tone: {
      slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
      green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
      amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
      rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
    },
  },
  defaultVariants: { tone: 'slate' },
});

type BadgeProps = TextProps & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <Text className={cn(badgeVariants({ tone }), className)} {...props} />;
}
