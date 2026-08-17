import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';

const DistanceDisplay = ({ specialistId, userLocation, showLabel = true }) => {
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (specialistId && userLocation?.latitude && userLocation?.longitude) {
      loadDistance();
    }
  }, [specialistId, userLocation]);

  const loadDistance = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/api/users/location/distance/${specialistId}`,
        {
          params: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }
        }
      );

      if (response?.data?.success) {
        setDistance(response.data.data.distance);
      }
    } catch (error) {
      console.warn('Could not load distance:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!distance && !loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="small" color="#EC1B23" />
      ) : (
        <>
          <Ionicons name="location" size={14} color="#EC1B23" />
          <Text style={styles.text}>
            {showLabel ? 'На расстоянии: ' : ''}{distance} км
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default DistanceDisplay;
