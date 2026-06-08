import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-slate-950/40">
        <Pressable className="flex-1" onPress={onClose} />
        <SafeAreaView edges={["bottom"]} className="max-h-[88%] rounded-t-[32px] bg-slate-50">
          <View className="items-center pt-3">
            <View className="h-1.5 w-12 rounded-full bg-slate-300" />
          </View>
          <View className="flex-row items-start justify-between gap-4 px-5 pb-3 pt-4">
            <View className="flex-1">
              <Text className="text-2xl font-black text-slate-950">{title}</Text>
              {subtitle ? <Text className="mt-1 text-sm text-slate-500">{subtitle}</Text> : null}
            </View>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white" onPress={onClose}>
              <X size={20} color="#0F172A" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-6">
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return (
    <View className={cn('items-center rounded-3xl border border-dashed border-slate-200 bg-white p-6', className)}>
      <Text className="text-lg font-black text-slate-900">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-slate-500">{description}</Text>
    </View>
  );
}
