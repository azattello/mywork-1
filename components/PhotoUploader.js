import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';

const PhotoUploader = ({ 
  applicationId, 
  endpoint = '/api/applications',
  maxPhotos = 10,
  onUploadSuccess,
  onUploadError 
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    if (selectedPhotos.length >= maxPhotos) {
      Alert.alert('Лимит', `Можно загрузить максимум ${maxPhotos} фото`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.cancelled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedPhotos([...selectedPhotos, asset]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать фото');
    }
  };

  const pickFromCamera = async () => {
    if (selectedPhotos.length >= maxPhotos) {
      Alert.alert('Лимит', `Можно загрузить максимум ${maxPhotos} фото`);
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Доступ запрещен', 'Нужен доступ к камере');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.cancelled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedPhotos([...selectedPhotos, asset]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const removePhoto = (index) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(newPhotos);
  };

  const uploadPhotos = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('Нет фото', 'Выберите фото для загрузки');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      
      selectedPhotos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `photo_${index}_${Date.now()}.jpg`,
        });
      });

      const response = await apiClient.post(
        `${endpoint}/${applicationId}/photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response?.data?.success) {
        Alert.alert('Успешно', 'Фото загружены');
        setSelectedPhotos([]);
        onUploadSuccess?.(response.data.data);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Ошибка', error?.response?.data?.message || 'Не удалось загрузить фото');
      onUploadError?.(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📸 Добавить фото заказа</Text>
        <Text style={styles.subtitle}>
          {selectedPhotos.length}/{maxPhotos}
        </Text>
      </View>

      {selectedPhotos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
        >
          {selectedPhotos.map((photo, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photo}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={pickImage}
          disabled={uploading}
        >
          <Ionicons name="images" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Галерея</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={pickFromCamera}
          disabled={uploading}
        >
          <Ionicons name="camera" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Камера</Text>
        </TouchableOpacity>

        {selectedPhotos.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={uploadPhotos}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Загрузить</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  photoScroll: {
    marginBottom: 12,
    maxHeight: 100,
  },
  photoWrapper: {
    marginRight: 8,
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  galleryButton: {
    backgroundColor: '#2196F3',
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  uploadButton: {
    backgroundColor: '#EC1B23',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PhotoUploader;
