import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Global toast instance holder
let toastRef = null;

export const setToastRef = (ref) => {
  toastRef = ref;
};

export const Toast = {
  show: (message, type = 'info', duration = 3000) => {
    if (toastRef) {
      toastRef.show(message, type, duration);
    }
  },
  success: (message, duration = 3000) => Toast.show(message, 'success', duration),
  error: (message, duration = 4000) => Toast.show(message, 'error', duration),
  warning: (message, duration = 3000) => Toast.show(message, 'warning', duration),
  info: (message, duration = 3000) => Toast.show(message, 'info', duration),
};

const ToastContainer = React.forwardRef((props, ref) => {
  const [toasts, setToasts] = React.useState([]);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const show = React.useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const newToast = { id, message, type };

    setToasts(prev => [...prev, newToast]);

    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    });
  }, [animatedValue]);

  React.useImperativeHandle(ref, () => ({ show }), [show]);

  if (toasts.length === 0) return null;

  const currentToast = toasts[0];
  const typeConfig = {
    success: { bg: '#4CAF50', icon: 'checkmark-circle' },
    error: { bg: '#F44336', icon: 'alert-circle' },
    warning: { bg: '#FF9800', icon: 'warning' },
    info: { bg: '#2196F3', icon: 'information-circle' },
  };

  const config = typeConfig[currentToast.type] || typeConfig.info;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={20} color="#fff" style={styles.icon} />
        <Text style={styles.message} numberOfLines={2}>
          {currentToast.message}
        </Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default ToastContainer;
