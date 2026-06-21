import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConfirmModal = React.forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({
    title: 'Подтверждение',
    message: 'Вы уверены?',
    confirmText: 'Да',
    cancelText: 'Отмена',
    onConfirm: () => {},
    onCancel: () => {},
    type: 'info', // 'info', 'warning', 'error'
    loading: false,
  });

  const show = (options) => {
    setData(prev => ({ ...prev, ...options }));
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  const handleConfirm = async () => {
    if (data.onConfirm) {
      await data.onConfirm();
    }
    hide();
  };

  const handleCancel = () => {
    if (data.onCancel) {
      data.onCancel();
    }
    hide();
  };

  React.useImperativeHandle(ref, () => ({ show, hide }), [data]);

  const typeConfig = {
    info: { color: '#2196F3', icon: 'information-circle' },
    warning: { color: '#FF9800', icon: 'warning' },
    error: { color: '#F44336', icon: 'alert-circle' },
  };

  const config = typeConfig[data.type] || typeConfig.info;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Icon */}
          <View style={[styles.iconBox, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={40} color="#fff" />
          </View>

          {/* Content */}
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.message}>{data.message}</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={data.loading}
            >
              <Text style={styles.cancelButtonText}>{data.cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: config.color }]}
              onPress={handleConfirm}
              disabled={data.loading}
            >
              <Text style={styles.confirmButtonText}>{data.confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    maxWidth: 300,
    width: '80%',
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConfirmModal;
