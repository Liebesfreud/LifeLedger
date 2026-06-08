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
import type { Category, Currency } from '@/types/domain';

const currencies: Currency[] = ['CNY', 'USD', 'EUR', 'GBP', 'JPY'];
const categoryColors = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const categories = useAppStore((state) => state.categories);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const initialize = useAppStore((state) => state.initialize);
  const addCategory = useAppStore((state) => state.addCategory);
  const removeCategory = useAppStore((state) => state.removeCategory);
  const [budget, setBudget] = useState(String(settings.monthlyBudget));
  const [idleDays, setIdleDays] = useState(String(settings.itemIdleAlertDays));
  const [categoryName, setCategoryName] = useState('');
  const [categoryModule, setCategoryModule] = useState<Category['module']>('subscription');
  const [categoryColor, setCategoryColor] = useState(categoryColors[0]);

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
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled || !result.assets[0]) return;
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const payload = JSON.parse(text);
      if (!payload || typeof payload !== 'object') throw new Error('invalid json');
      await importSnapshot(payload);
      await initialize();
      Alert.alert('导入完成', '数据已合并到本地数据库。');
    } catch {
      Alert.alert('导入失败', '请选择由 SubTrack 导出的有效 JSON 文件。');
    }
  };

  const createCategory = async () => {
    if (!categoryName.trim()) return Alert.alert('请填写分类名称');
    await addCategory({ name: categoryName.trim(), module: categoryModule, color: categoryColor });
    setCategoryName('');
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

      <Card className="mb-4 gap-3">
        <Text className="text-lg font-black text-slate-950">分类管理</Text>
        <Input placeholder="分类名称，例如 AI 工具 / 厨房用品" value={categoryName} onChangeText={setCategoryName} />
        <View className="flex-row gap-2">
          <Button className="flex-1" size="sm" variant={categoryModule === 'subscription' ? 'default' : 'secondary'} onPress={() => setCategoryModule('subscription')}>订阅分类</Button>
          <Button className="flex-1" size="sm" variant={categoryModule === 'item' ? 'default' : 'secondary'} onPress={() => setCategoryModule('item')}>物品分类</Button>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {categoryColors.map((color) => (
            <Button key={color} size="sm" variant={categoryColor === color ? 'default' : 'secondary'} onPress={() => setCategoryColor(color)}>
              {color}
            </Button>
          ))}
        </View>
        <Button onPress={createCategory}>新增分类</Button>
        {(['subscription', 'item'] as const).map((module) => (
          <View key={module} className="gap-2">
            <Text className="font-semibold text-slate-700">{module === 'subscription' ? '订阅分类' : '物品分类'}</Text>
            {categories.filter((category) => category.module === module).map((category) => (
              <View key={category.id} className="flex-row items-center justify-between rounded-2xl bg-slate-50 p-3">
                <View className="flex-row items-center gap-2">
                  <View className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <Text className="font-bold text-slate-900">{category.name}</Text>
                </View>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => Alert.alert('删除分类', `删除 ${category.name} 后，关联数据会变为未分类。`, [
                    { text: '取消', style: 'cancel' },
                    { text: '删除', style: 'destructive', onPress: () => removeCategory(category.id) },
                  ])}
                >
                  删除
                </Button>
              </View>
            ))}
          </View>
        ))}
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
