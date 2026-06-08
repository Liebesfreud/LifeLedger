import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Input({ className, placeholderTextColor = '#94A3B8', ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn('h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50', className)}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
}
