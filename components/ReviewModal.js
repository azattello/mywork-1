import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ReviewModal = ({ visible, onClose, onSubmit, loading = false, userName = 'Специалист' }) => {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [pickingImage, setPickingImage] = useState(false);

  const handleSubmit = async () => {
    if (text.trim().length < 10) {
      Alert.alert('Ошибка', 'Отзыв должен содержать минимум 10 символов');
      return;
    }

    await onSubmit({
      rating,
      text: text.trim(),
      image,
    });

    // Reset form
    setRating(5);
    setText('');
    setImage(null);
  };

  const handlePickImage = async () => {
    setPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.cancelled) {
        setImage(result.uri || result.assets?.[0]?.uri);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    } finally {
      setPickingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFD700' : '#DDD'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Оставить отзыв</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentPadding}
            showsVerticalScrollIndicator={false}
          >
            {/* User Name */}
            <Text style={styles.userName}>Для {userName}</Text>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Оценка</Text>
              {renderStars()}
              <Text style={styles.ratingValue}>
                {rating} из 5 звёзд
              </Text>
            </View>

            {/* Review Text */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Текст отзыва</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Расскажите о вашем опыте работы со специалистом..."
                placeholderTextColor="#999"
                multiline
                value={text}
                onChangeText={setText}
                maxLength={500}
                editable={!loading}
              />
              <Text style={styles.charCount}>
                {text.length}/500
              </Text>
            </View>

            {/* Image Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Добавить фото (опционально)</Text>
              
              {image ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                    disabled={loading}
                  >
                    <Ionicons name="close-circle" size={28} color="#EC1B23" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={handlePickImage}
                  disabled={loading || pickingImage}
                >
                  {pickingImage ? (
                    <ActivityIndicator size="small" color="#EC1B23" />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={24} color="#EC1B23" />
                      <Text style={styles.imageButtonText}>
                        Выбрать фото из галереи
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || text.trim().length < 10}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Отправить отзыв</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  userName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    marginHorizontal: 8,
    padding: 4,
  },
  ratingValue: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  imageButton: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 12,
    color: '#EC1B23',
    marginTop: 8,
    fontWeight: '500',
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#EC1B23',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ReviewModal;
