import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';

const FileAttachmentPicker = ({ 
  conversationId, 
  toUserId,
  onFileSelected,
  onUploadComplete,
  onError 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handlePickImage = async () => {
    setShowMenu(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.cancelled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `image_${Date.now()}.jpg`,
          displayName: asset.uri.split('/').pop(),
        });
        onFileSelected?.(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать фото');
    }
  };

  const handleTakePhoto = async () => {
    setShowMenu(false);
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
        setSelectedFile({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `camera_${Date.now()}.jpg`,
          displayName: `Фото ${new Date().toLocaleTimeString()}`,
        });
        onFileSelected?.(asset);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert('Ошибка', 'Файл не выбран');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('attachments', {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name,
      });
      formData.append('to', toUserId);
      formData.append('text', '');

      const response = await apiClient.post(
        `/api/messages/${conversationId}/file-upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response?.data?.success) {
        setSelectedFile(null);
        onUploadComplete?.(response.data.data);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Ошибка', error?.response?.data?.message || 'Не удалось загрузить файл');
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.attachButton}
        onPress={() => setShowMenu(!showMenu)}
        disabled={uploading}
      >
        <Ionicons name="add-circle" size={24} color="#EC1B23" />
      </TouchableOpacity>

      {showMenu && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="images" size={20} color="#2196F3" />
            <Text style={styles.menuItemText}>Фото из галереи</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTakePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera" size={20} color="#4CAF50" />
            <Text style={styles.menuItemText}>Сделать фото</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedFile && (
        <View style={styles.preview}>
          <View style={styles.previewContent}>
            <Text style={styles.previewText}>Загружаемый файл:</Text>
            <Text style={styles.fileName}>{selectedFile.displayName}</Text>
          </View>

          <View style={styles.previewButtons}>
            <TouchableOpacity
              style={[styles.previewButton, styles.cancelButton]}
              onPress={cancelUpload}
              disabled={uploading}
            >
              <Ionicons name="close" size={18} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewButton, styles.uploadButton, uploading && styles.uploadDisabled]}
              onPress={uploadFile}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="cloud-upload" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  attachButton: {
    padding: 8,
  },
  menu: {
    position: 'absolute',
    bottom: 50,
    right: -20,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    minWidth: 180,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  preview: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  uploadButton: {
    backgroundColor: '#EC1B23',
  },
  uploadDisabled: {
    opacity: 0.6,
  },
});

export default FileAttachmentPicker;
