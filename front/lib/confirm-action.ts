import { Alert, Platform } from 'react-native';

type ConfirmedAction = () => void | Promise<void>;

function runConfirmedAction(action: ConfirmedAction) {
  Promise.resolve(action()).catch((error) => console.error('Confirmed action failed', error));
}

export function confirmAction(title: string, message: string, action: ConfirmedAction) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm(`${title}\n\n${message}`)) runConfirmedAction(action);
    return;
  }

  Alert.alert(title, message, [
    { text: '取消', style: 'cancel' },
    { text: '删除', style: 'destructive', onPress: () => runConfirmedAction(action) },
  ]);
}
