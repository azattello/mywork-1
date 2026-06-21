import { Platform, ToastAndroid, Alert } from 'react-native';

const showToast = (message, title) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // Simple fallback for iOS — use Alert
    if (title) Alert.alert(title, message);
    else Alert.alert('Сообщение', message);
  }
};

export default showToast;