import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';

const CreateReviewModal = ({ visible, applicationId, specialistId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [timingRating, setTimingRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmitReview = async () => {
    if (!rating) {
      Alert.alert('Ошибка', 'Выберите оценку');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        applicationId,
        toUserId: specialistId,
        rating,
        qualityRating,
        timingRating,
        communicationRating,
        text: text.trim() || ''
      };

      const response = await apiClient.post('/api/users/reviews/create', payload);

      if (response?.data?.success) {
        Alert.alert('Успешно', 'Отзыв добавлен', [
          {
            text: 'ОК',
            onPress: () => {
              onSuccess?.();
              onClose();
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error creating review:', error);
      Alert.alert('Ошибка', error?.response?.data?.message || 'Не удалось отправить отзыв');
    } finally {
      setSaving(false);
    }
  };

  const renderStarSelector = (currentRating, setRating, label) => (
    <View style={styles.ratingSelector}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={32}
              color={star <= currentRating ? '#FFD700' : '#DDD'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingValue}>
        {currentRating > 0 ? `${currentRating}/5` : 'Не выбрано'}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Ionicons name="close" size={28} color={saving ? '#CCC' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Оставить отзыв</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Основная оценка */}
          {renderStarSelector(rating, setRating, '⭐ Общая оценка')}

          <View style={styles.divider} />

          {/* Критерии оценки */}
          <Text style={styles.criteriaTitle}>📋 Оцените по критериям</Text>

          {renderStarSelector(qualityRating, setQualityRating, 'Качество работы')}
          {renderStarSelector(timingRating, setTimingRating, 'Соблюдение сроков')}
          {renderStarSelector(communicationRating, setCommunicationRating, 'Коммуникация')}

          <View style={styles.divider} />

          {/* Текстовый отзыв */}
          <Text style={styles.textLabel}>💬 Ваш отзыв (опционально)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Расскажите о вашем опыте работы со специалистом..."
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={6}
            maxLength={500}
            editable={!saving}
          />
          <Text style={styles.charCount}>
            {text.length}/500
          </Text>

          <View style={styles.divider} />

          {/* Кнопки действия */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={[styles.buttonText, { color: '#666' }]}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, saving && styles.submitButtonDisabled]}
              onPress={handleSubmitReview}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Отправить отзыв</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ratingSelector: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 8,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingValue: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  criteriaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12,
  },
  textLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#000',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#EC1B23',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateReviewModal;
