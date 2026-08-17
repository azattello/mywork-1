import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';

const FavoriteButton = ({ specialistId, size = 24, onToggle }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadFavoriteStatus();
  }, [specialistId]);

  const loadFavoriteStatus = async () => {
    try {
      setInitialLoading(true);
      const response = await apiClient.get(
        `/api/favorites/${specialistId}/check`
      );

      if (response?.data?.success) {
        setIsFavorite(response.data.data.isFavorite);
      }
    } catch (error) {
      console.warn('Could not load favorite status:', error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    setLoading(true);
    try {
      if (isFavorite) {
        // Удалить из избранного
        const response = await apiClient.delete(
          `/api/favorites/${specialistId}`
        );

        if (response?.data?.success) {
          setIsFavorite(false);
          onToggle?.(false);
        }
      } else {
        // Добавить в избранное
        const response = await apiClient.post(
          `/api/favorites/${specialistId}`
        );

        if (response?.data?.success) {
          setIsFavorite(true);
          onToggle?.(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось обновить избранное'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ActivityIndicator
        size="small"
        color="#EC1B23"
        style={styles.loadingContainer}
      />
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleToggleFavorite}
      disabled={loading}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? '#EC1B23' : '#999'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
  loadingContainer: {
    padding: 8,
  },
});

export default FavoriteButton;
