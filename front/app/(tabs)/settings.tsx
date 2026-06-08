import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { Alert, Share, Switch, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { exportSnapshot, importSnapshot } from '@/lib/db';
import { useAppStore } from '@/store/app-store';
import type { Currency } from '@/types/domain';

const currencies: Currency[] = ['CNY', 'USD', 'EUR', 'GBP', 'JPY'];

export default function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const initialize = useAppStore((state) => state.initialize);
  const [budget, setBudget] = useState(String(settings.monthlyBudget));
  const [idleDays, setIdleDays] = useState(String(settings.itemIdleAlertDays));

  const save = async () => {
    await updateSettings({
      ...settings,
      monthlyBudget: Number(budget) || 0,
      itemIdleAlertDays: Number(idleDays) || 1,
    });
    Alert.alert('已保存', '设置已更新');
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) return Alert.alert('通知未授权', '请在系统设置中允许通知。');
    }
    await updateSettings({ ...settings, notificationEnabled: value });
  };

  const exportData = async () => {
    const snapshot = await exportSnapshot();
    const path = `${FileSystem.cacheDirectory}subtrack-export-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(snapshot, null, 2));
    await Share.share({ url: path, message: JSON.stringify(snapshot) });
  };

  const importData = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (result.canceled || !result.assets[0]) return;
    const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
    await importSnapshot(JSON.parse(text));
    await initialize();
    Alert.alert('导入完成', '数据已合并到本地数据库。');
  };

  return (
    <Screen title="设置" subtitle="本地优先、可导入导出、可申请 Android 通知权限">
      <Card className="mb-4 gap-3">
        <Text className="text-lg font-black text-slate-950">偏好设置</Text>
        <Text className="font-semibold text-slate-700">基础币种</Text>
        <View className="flex-row flex-wrap gap-2">
          {currencies.map((currency) => (
            <Button key={currency} size="sm" variant={settings.baseCurrency === currency ? 'default' : 'secondary'} onPress={() => updateSettings({ ...settings, baseCurrency: currency })}>
              {currency}
            </Button>
          ))}
        </View>
        <Text className="font-semibold text-slate-700">月度订阅预算</Text>
        <Input keyboardType="decimal-pad" value={budget} onChangeText={setBudget} />
        <Text className="font-semibold text-slate-700">默认物品闲置提醒天数</Text>
        <Input keyboardType="number-pad" value={idleDays} onChangeText={setIdleDays} />
        <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 p-3">
          <View>
            <Text className="font-bold text-slate-900">本地通知</Text>
            <Text className="text-sm text-slate-500">用于续费和闲置提醒</Text>
          </View>
          <Switch value={settings.notificationEnabled} onValueChange={toggleNotifications} />
        </View>
        <Button onPress={save}>保存设置</Button>
      </Card>

      <Card className="gap-3">
        <Text className="text-lg font-black text-slate-950">数据安全</Text>
        <Text className="text-slate-500">数据保存在设备本地 SQLite。你可以导出 JSON 做备份，也可以从 JSON 合并恢复。</Text>
        <View className="flex-row gap-3">
          <Button className="flex-1" variant="secondary" onPress={exportData}>导出</Button>
          <Button className="flex-1" onPress={importData}>导入</Button>
        </View>
      </Card>
    </Screen>
  );
}
