import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { useNavigation } from '@react-navigation/native';

export default function NoActiveApps({ navigation }) {
  const nav = navigation || useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const currentUserStr = await AsyncStorage.getItem('@currentUser');
      if (!currentUserStr) {
        setData([]);
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      const userId = currentUser?._id || currentUser?.id;

      if (!userId) {
        setData([]);
        return;
      }

      const res = await apiClient.get(`/api/applications/user/${userId}`);

      if (res.data && res.data.success && res.data.data) {
        // Фильтруем завершенные заказы (status = 'completed' или 'cancelled')
        const completedApps = res.data.data.filter(
          app => app && (app.status === 'completed' || app.status === 'cancelled')
        );
        setData(completedApps);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить заказы');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const handleOpenDetail = (item) => {
    const id = item?._id || item?.id;
    nav.navigate('ApplicationDetail', { applicationId: id });
  };

  const handleViewResponses = (item) => {
    const id = item?._id || item?.id;
    nav.navigate('ResponsesView', { applicationId: id, applicationTitle: item?.title });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handleOpenDetail(item)}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.price}>{item.summ} ₸</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.info || 'Нет описания'}
      </Text>

      {item.city && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.infoText}>{(item.city && (item.city.name || item.city))}</Text>
        </View>
      )}

      {item.currentSpecialist && (
        <View style={styles.specialistSection}>
          <Ionicons name="person-circle" size={24} color="#EC1B23" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.specialistName} numberOfLines={1}>
              {item.currentSpecialist.surname} {item.currentSpecialist.name}
            </Text>
          </View>
        </View>
      )}

      {item.review && item.status === 'completed' && (
        <View style={styles.reviewBox}>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < item.review.rating ? 'star' : 'star-outline'}
                size={14}
                color="#FFC107"
              />
            ))}
          </View>
          <Text style={styles.reviewText} numberOfLines={2}>{item.review.text}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('ru-RU')}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.responseButton}
          onPress={() => handleViewResponses(item)}
        >
          <Ionicons name="eye-outline" size={14} color="#EC1B23" />
          <Text style={styles.responseButtonText}>Отклики</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#EC1B23" />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-done-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Нет завершенных заказов</Text>
        <Text style={styles.emptySubtext}>Ваши завершенные заказы появятся здесь</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item._id || item.id || item.title)}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC1B23" />
      }
      contentContainerStyle={styles.listContent}
      scrollEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  listContent: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleSection: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    lineHeight: 20,
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EC1B23',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  specialistSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 8,
  },
  specialistName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  reviewBox: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  responseButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EC1B23',
  },
});
