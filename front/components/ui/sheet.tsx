import { ScrollView, View } from 'react-native';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

export function Sheet({
  visible,
  title,
  subtitle,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88%] rounded-3xl p-0">
        <DialogHeader className="px-6 pb-2 pt-6 text-left">
          <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
          {subtitle ? <DialogDescription className="leading-5">{subtitle}</DialogDescription> : null}
        </DialogHeader>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-6 pb-6">
            {children}
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return (
    <View className={cn('items-center rounded-3xl border border-dashed border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900', className)}>
      <Text className="text-lg font-black text-slate-900 dark:text-slate-50">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</Text>
    </View>
  );
}
