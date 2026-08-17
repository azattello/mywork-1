import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';

const COMPLAINT_TYPES = [
  { id: 'unprofessional_behavior', label: '😠 Непрофессиональное поведение' },
  { id: 'rude_communication', label: '💬 Грубое общение' },
  { id: 'payment_issue', label: '💰 Проблема с оплатой' },
  { id: 'work_not_completed', label: '❌ Работа не выполнена' },
  { id: 'quality_issue', label: '⚠️ Проблема с качеством' },
  { id: 'misrepresentation', label: '🚫 Ложное представление' },
  { id: 'scam', label: '🔴 Мошенничество' },
  { id: 'offensive_content', label: '⛔ Оскорбительный контент' },
  { id: 'other', label: '❓ Другое' }
];

const ComplaintModal = ({ visible, onClose, applicationId, reportedUserId, onSuccess }) => {
  const [complaintType, setComplaintType] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitComplaint = async () => {
    // Валидация
    if (!complaintType) {
      Alert.alert('Ошибка', 'Выберите тип жалобы');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Ошибка', 'Опишите проблему');
      return;
    }

    if (description.length > 1000) {
      Alert.alert('Ошибка', 'Описание не должно быть длиннее 1000 символов');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/complaints', {
        applicationId,
        reportedUserId,
        complaintType,
        description
      });

      if (response?.data?.success) {
        Alert.alert('Успешно', 'Ваша жалоба отправлена на рассмотрение');
        setComplaintType(null);
        setDescription('');
        onSuccess?.();
        onClose?.();
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось подать жалобу'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setComplaintType(null);
      setDescription('');
      onClose?.();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Подать жалобу</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Выбор типа жалобы */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Тип жалобы</Text>
            <Text style={styles.sectionDescription}>Выберите подходящую категорию</Text>
            
            {COMPLAINT_TYPES.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.complaintTypeOption,
                  complaintType === type.id && styles.complaintTypeOptionSelected
                ]}
                onPress={() => setComplaintType(type.id)}
                disabled={loading}
              >
                <View style={styles.radioCircle}>
                  {complaintType === type.id && (
                    <View style={styles.radioDot} />
                  )}
                </View>
                <Text style={[
                  styles.complaintTypeLabel,
                  complaintType === type.id && styles.complaintTypeSelectedLabel
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Описание жалобы */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.sectionDescription}>
              Подробно опишите проблему (максимум 1000 символов)
            </Text>
            
            <TextInput
              style={styles.descriptionInput}
              placeholder="Опишите проблему подробно..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={6}
              maxLength={1000}
              editable={!loading}
            />
            
            <Text style={styles.characterCount}>
              {description.length}/1000
            </Text>
          </View>

          {/* Информация */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Ваша жалоба будет рассмотрена нашей командой. Все данные жалоб обрабатываются конфиденциально.
            </Text>
          </View>
        </ScrollView>

        {/* Кнопки действия */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Отмена</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitComplaint}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Подать жалобу</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  complaintTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  complaintTypeOptionSelected: {
    borderColor: '#EC1B23',
    backgroundColor: '#FFF8F8',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EC1B23',
  },
  complaintTypeLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  complaintTypeSelectedLabel: {
    color: '#000',
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#000',
    backgroundColor: '#FFF',
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#EC1B23',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ComplaintModal;
