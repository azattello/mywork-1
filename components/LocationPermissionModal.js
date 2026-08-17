import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';

const LocationPermissionModal = ({ visible, onLocationReceived, onClose, isSpecialist = false }) => {
  const [loading, setLoading] = useState(false);

  const requestLocationPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Доступ запрещен',
          'Нужен доступ к геолокации для поиска специалистов',
          [{ text: 'ОК', onPress: () => {} }]
        );
        setLoading(false);
        return;
      }

      // Получаем текущее местоположение
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Сохраняем в AsyncStorage
      await AsyncStorage.setItem('@userLocation', JSON.stringify({
        latitude,
        longitude,
        timestamp: Date.now(),
      }));

      // Если это специалист, обновляем его локацию на сервере
      if (isSpecialist) {
        try {
          const response = await apiClient.post('/api/users/location/update', {
            latitude,
            longitude,
            serviceRadius: 50, // Стандартный радиус 50 км
          });

          if (response?.data?.success) {
            Alert.alert('Успешно', 'Ваша локация сохранена');
          }
        } catch (err) {
          console.warn('Could not update location on server:', err.message);
          // Продолжаем даже если не удалось обновить на сервере
        }
      }

      onLocationReceived?.({ latitude, longitude });
      onClose?.();
    } catch (error) {
      console.error('Error requesting location:', error);
      Alert.alert('Ошибка', 'Не удалось получить вашу локацию');
    } finally {
      setLoading(false);
    }
  };

  const skipLocation = () => {
    Alert.alert(
      'Пропустить?',
      'Без локации поиск по расстоянию будет ограничен.',
      [
        { text: 'Вернуться', style: 'cancel' },
        { text: 'Пропустить', onPress: () => onClose?.() }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={skipLocation}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="location-sharp" size={28} color="#EC1B23" />
          </View>

          <Text style={styles.title}>Геолокация</Text>
          <Text style={styles.description}>
            {isSpecialist
              ? 'Чтобы клиенты находили вас рядом.'
              : 'Чтобы показывать специалистов рядом с вами.'}
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.featureText}>Поиск рядом</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.featureText}>Безопасно</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.featureText}>Только для поиска</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={requestLocationPermission}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Включить</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={skipLocation}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Позже</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  featureList: {
    width: '100%',
    marginBottom: 18,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#EC1B23',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});

export default LocationPermissionModal;
