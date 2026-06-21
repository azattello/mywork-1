import { StatusBar } from 'expo-status-bar';
import { AppRegistry, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React, { useRef } from 'react';
import Navigate from './navigate';
import ToastContainer, { setToastRef } from './utils/ToastManager';
import ConfirmModal from './components/ConfirmModal';

export default function App() {
  const toastRef = useRef(null);
  const confirmRef = useRef(null);
  const [unreadChatsCount, setUnreadChatsCount] = React.useState(0);

  React.useEffect(() => {
    setToastRef(toastRef.current);
    global.setUnreadChatsCount = setUnreadChatsCount;
  }, []);

  // Make ConfirmModal globally accessible if needed
  global.confirmModal = confirmRef.current;

  return (
    <>
      <Navigate />
      <ToastContainer ref={toastRef} />
      <ConfirmModal ref={confirmRef} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    
  },
});
