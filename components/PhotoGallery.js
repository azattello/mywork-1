import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';

const PhotoGallery = ({ 
  photos = [], 
  applicationId,
  canDelete = false,
  onPhotoDelete,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handleDeletePhoto = async (photoUrl) => {
    Alert.alert('Удалить фото?', 'Вы уверены?', [
      { text: 'Отмена', onPress: () => {} },
      {
        text: 'Удалить',
        onPress: async () => {
          setDeleting(true);
          try {
            const encodedUrl = encodeURIComponent(photoUrl);
            const response = await apiClient.delete(
              `/api/applications/${applicationId}/photos/${encodedUrl}`
            );

            if (response?.data?.success) {
              onPhotoDelete?.(photoUrl);
              setSelectedPhotoIndex(null);
              Alert.alert('Успешно', 'Фото удалено');
            }
          } catch (error) {
            console.error('Error deleting photo:', error);
            Alert.alert('Ошибка', 'Не удалось удалить фото');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📸 Фото заказа ({photos.length})</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.photoScroll}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoWrapper}
            onPress={() => setSelectedPhotoIndex(index)}
          >
            <Image
              source={{ uri: photo.url }}
              style={styles.photo}
            />
            <View style={styles.photoOverlay}>
              <Ionicons name="expand" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedPhotoIndex !== null && (
        <PhotoDetailModal
          photo={photos[selectedPhotoIndex]}
          onClose={() => setSelectedPhotoIndex(null)}
          onDelete={() => {
            if (canDelete) {
              handleDeletePhoto(photos[selectedPhotoIndex].url);
            }
          }}
          canDelete={canDelete}
          deleting={deleting}
        />
      )}
    </View>
  );
};

const PhotoDetailModal = ({ 
  photo, 
  onClose, 
  onDelete, 
  canDelete = false,
  deleting = false 
}) => {
  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} disabled={deleting}>
            <Ionicons
              name="close"
              size={28}
              color={deleting ? '#CCC' : '#FFF'}
            />
          </TouchableOpacity>
          <Text style={styles.modalHeaderText}>Фото</Text>
          {canDelete && (
            <TouchableOpacity onPress={onDelete} disabled={deleting}>
              {deleting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="trash" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.photoContainer}>
          <Image
            source={{ uri: photo.url }}
            style={styles.fullPhoto}
            resizeMode="contain"
          />
        </View>

        {photo.uploadedAt && (
          <View style={styles.photoInfo}>
            <Text style={styles.infoText}>
              📅 {new Date(photo.uploadedAt).toLocaleDateString('ru-RU')} 
              {' '}
              {new Date(photo.uploadedAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  photoScroll: {
    maxHeight: 120,
  },
  photoWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fullPhoto: {
    width: '100%',
    height: '100%',
  },
  photoInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoText: {
    color: '#AAA',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PhotoGallery;
