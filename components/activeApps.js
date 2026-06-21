import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';
import { addNotificationHandler, removeNotificationHandler } from '../utils/socketService';

const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonTitle} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonText} />
  </View>
);

export default function ActiveApps({ navigation }) {
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await loadCurrentUser();
      await loadApplications();
    };
    loadData();

    // Listen for notifications (new responses)
    const handleNotification = (notifData) => {
      console.log('Notification received in activeApps:', notifData);
      // Reload applications to get updated response counts
      if (notifData && (notifData.type === 'response' || notifData.applicationId)) {
        loadApplications();
      }
    };

    const unsubscribe = addNotificationHandler(handleNotification);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadCurrentUser = async () => {
    const userStr = await AsyncStorage.getItem('@currentUser');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (!userStr) {
        setApps([]);
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
      const userId = user?._id || user?.id;
      if (!userId) {
        setApps([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.get(`/api/applications/user/${userId}`);
      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list)) {
        const activeApps = list.filter(
          (app) => app && app.status === 'open' && app.active !== false
        );
        setApps(activeApps);
        setFilteredApps(activeApps);
      } else {
        setApps([]);
        setFilteredApps([]);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
      Toast.error('Не удалось загрузить заказы');
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
    Toast.success('Обновлено');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter((app) =>
        (app?.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (app?.info || '').toLowerCase().includes(query.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  };

  const openResponses = (app) => {
    const appId = app?._id || app?.id;
    navigation.navigate('ResponsesView', {
      applicationId: appId,
      applicationTitle: app?.title,
    });
  };

  const renderApplicationCard = ({ item }) => {
    const cityName = item.city && typeof item.city === 'object' ? item.city.name : item.city;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ApplicationDetail', { applicationId: item._id })
        }
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.status}>
                {item.status === 'open' ? 'Открыт' : item.status === 'in_progress' ? 'В работе' : 'Закрыт'}
              </Text>
            </View>
            <Text style={styles.price}>
              {item.budgetType === 'fixed'
                ? `${item.summ} ₸`
                : item.budgetMin && item.budgetMax
                ? `${item.budgetMin}-${item.budgetMax} ₸`
                : `${item.summ || '0'} ₸`}
            </Text>
          </View>

          {/* Description */}
          {item.info && (
            <Text style={styles.description} numberOfLines={2}>
              {item.info}
            </Text>
          )}

          {/* Details */}
          <View style={styles.detailsSection}>
            {cityName && (
              <View style={styles.detail}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.detailText} numberOfLines={1}>{cityName}</Text>
              </View>
            )}

            {item.workMode && (
              <View style={styles.detail}>
                <Ionicons
                  name={item.workMode === 'online' ? 'globe-outline' : 'briefcase-outline'}
                  size={14}
                  color="#666"
                />
                <Text style={styles.detailText}>
                  {item.workMode === 'online' ? 'Онлайн' : 'Офлайн'}
                </Text>
              </View>
            )}

            {item.deadline && (
              <View style={styles.detail}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {new Date(item.deadline).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            )}
          </View>

          {/* Categories */}
          {item.categories && item.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {item.categories.slice(0, 2).map((cat, i) => (
                <View key={i} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
              ))}
              {item.categories.length > 2 && (
                <Text style={styles.moreText}>+{item.categories.length - 2}</Text>
              )}
            </View>
          )}

          {/* Responses Button */}
          <TouchableOpacity
            style={styles.responsesBtn}
            onPress={() => openResponses(item)}
          >
            <Ionicons name="eye-outline" size={14} color="#EC1B23" />
            <Text style={styles.responsesBtnText}>
              Отклики ({item.responses?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (!filteredApps || filteredApps.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="document-outline" size={48} color="#ccc" />
        <Text style={styles.emptyTitle}>Нет активных заказов</Text>
        <Text style={styles.emptySub}>Создайте новый заказ, чтобы начать</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredApps}
        renderItem={renderApplicationCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  status: {
    fontSize: 11,
    color: '#EC1B23',
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
    marginBottom: 12,
  },
  detailsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    maxWidth: 120,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#EC1B23',
  },
  categoryText: {
    fontSize: 11,
    color: '#EC1B23',
    fontWeight: '600',
  },
  moreText: {
    fontSize: 11,
    color: '#EC1B23',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  responsesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  responsesBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EC1B23',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  emptySub: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonText: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '100%',
  },
});
