import { Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/utils';

type ButtonProps = PressableProps & {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm';
};

const buttonVariants = {
  default: 'bg-blue-600 active:bg-blue-700',
  secondary: 'bg-slate-100 active:bg-slate-200',
  ghost: 'bg-transparent active:bg-slate-100',
  destructive: 'bg-rose-600 active:bg-rose-700',
};

const textVariants = {
  default: 'text-white',
  secondary: 'text-slate-900',
  ghost: 'text-slate-700',
  destructive: 'text-white',
};

export function Button({ children, className, variant = 'default', size = 'default', disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      className={cn('items-center justify-center rounded-2xl px-4', size === 'sm' ? 'h-10' : 'h-12', buttonVariants[variant], disabled && 'opacity-50', className)}
      disabled={disabled}
      {...props}
    >
      <Text className={cn('font-semibold', textVariants[variant])}>{children}</Text>
    </Pressable>
  );
}
