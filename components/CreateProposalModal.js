import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CreateProposalModal = ({ visible, onClose, onSubmit, specialistName, isLoading }) => {
  const [title, setTitle] = useState(`Предложение для ${specialistName || ''}`);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || title.trim().length < 3) {
      alert('Заголовок должен быть минимум 3 символа');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      alert('Описание должно быть минимум 10 символов');
      return;
    }
    onSubmit({ title, description });
    setTitle(`Предложение для ${specialistName || ''}`);
    setDescription('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={isLoading}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Создать предложение</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading || !title.trim() || !description.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#EC1B23" />
            ) : (
              <Ionicons name="checkmark" size={28} color="#EC1B23" />
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Specialist Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Специалист</Text>
            <View style={styles.specialistBox}>
              <Ionicons name="person-circle" size={40} color="#999" />
              <Text style={styles.specialistName}>{specialistName || 'Неизвестно'}</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Заголовок предложения</Text>
            <TextInput
              style={styles.input}
              placeholder="Заголовок"
              value={title}
              onChangeText={setTitle}
              maxLength={70}
              editable={!isLoading}
            />
            <Text style={styles.counter}>{title.length}/70</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Описание предложения</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Подробно опишите, что вам нужно..."
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
              multiline
              numberOfLines={6}
              editable={!isLoading}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{description.length}/1000</Text>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Специалист получит уведомление о вашем предложении. Вы сможете обсудить детали в чате.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  textarea: {
    height: 120,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  counter: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  specialistBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    gap: 12,
  },
  specialistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 16,
  },
});

export default CreateProposalModal;
