import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const SystemMessage = ({ message }) => {
  if (!message || message.messageType !== 'system') {
    return null;
  }

  const getSystemMessageStyle = (eventType) => {
    switch (eventType) {
      case 'work_started':
        return { backgroundColor: '#E3F2FD', borderLeftColor: '#2196F3' };
      case 'work_updated':
        return { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' };
      case 'work_completed':
        return { backgroundColor: '#E8F5E9', borderLeftColor: '#4CAF50' };
      case 'work_accepted':
        return { backgroundColor: '#E8F5E9', borderLeftColor: '#4CAF50' };
      case 'work_rejected':
        return { backgroundColor: '#FFEBEE', borderLeftColor: '#F44336' };
      case 'specialist_assigned':
        return { backgroundColor: '#F3E5F5', borderLeftColor: '#9C27B0' };
      case 'status_changed':
        return { backgroundColor: '#F5F5F5', borderLeftColor: '#757575' };
      default:
        return { backgroundColor: '#F5F5F5', borderLeftColor: '#999' };
    }
  };

  const getSystemMessageIcon = (eventType) => {
    const icons = {
      'work_started': '🚀',
      'work_updated': '✏️',
      'work_completed': '✅',
      'work_accepted': '👍',
      'work_rejected': '❌',
      'specialist_assigned': '👤',
      'status_changed': '📊',
    };
    return icons[eventType] || '📌';
  };

  const style = getSystemMessageStyle(message.systemEventType);
  const icon = getSystemMessageIcon(message.systemEventType);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={styles.text}>{message.text}</Text>
        {message.systemData && message.systemData.newStatus && (
          <Text style={styles.detail}>
            Статус: {message.systemData.oldStatus} → {message.systemData.newStatus}
          </Text>
        )}
        <Text style={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    gap: 10,
  },
  icon: {
    fontSize: 18,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detail: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
});

export default SystemMessage;
