import { Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('items-center justify-center rounded-2xl px-4', {
  variants: {
    variant: {
      default: 'bg-blue-600 active:bg-blue-700',
      secondary: 'bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700',
      ghost: 'bg-transparent active:bg-slate-100 dark:active:bg-slate-800',
      destructive: 'bg-rose-600 active:bg-rose-700',
    },
    size: {
      default: 'h-12',
      sm: 'h-10',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const textVariants = cva('font-semibold', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-slate-900 dark:text-slate-50',
      ghost: 'text-slate-700 dark:text-slate-200',
      destructive: 'text-white',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type ButtonProps = PressableProps & VariantProps<typeof buttonVariants> & {
  children: React.ReactNode;
};

export function Button({ children, className, variant = 'default', size = 'default', disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }), disabled && 'opacity-50', className)}
      disabled={disabled}
      {...props}
    >
      <Text className={cn(textVariants({ variant }))}>{children}</Text>
    </Pressable>
  );
}
