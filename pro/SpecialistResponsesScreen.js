import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';

export default function SpecialistResponsesScreen({ navigation }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const currentUserStr = await AsyncStorage.getItem('@currentUser');
      if (!currentUserStr) {
        setResponses([]);
        return;
      }

      const currentUser = JSON.parse(currentUserStr);
      const userId = currentUser?._id || currentUser?.id;

      if (!userId) {
        setResponses([]);
        return;
      }

      // Получить все заказы, а затем отфильтровать те где специалист отправлял отклик
      const res = await apiClient.get('/api/applications');

      if (res.data && res.data.success && res.data.data) {
        const allApplications = res.data.data;
        
        // Для каждого заказа получаем его отклики и ищем отклик текущего пользователя
        const userResponses = [];
        
        for (const app of allApplications) {
          try {
            const responsesRes = await apiClient.get(`/api/applications/${app._id}/responses`);
            if (responsesRes.data && responsesRes.data.data) {
              const userResponse = responsesRes.data.data.find(
                r => r.specialist?._id === userId || r.specialist === userId
              );
              if (userResponse) {
                userResponses.push({
                  ...userResponse,
                  application: app,
                });
              }
            }
          } catch (err) {
            // Игнорируем ошибки для отдельных заказов
          }
        }
        
        setResponses(userResponses);
      } else {
        setResponses([]);
      }
    } catch (err) {
      console.error('Error loading responses:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить отклики');
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResponses();
    setRefreshing(false);
  };

  const handleOpenApplication = (item) => {
    navigation.navigate('ApplicationDetail', {
      applicationId: item.application._id,
    });
  };

  const handleOpenChat = (item) => {
    // Открыть чат с заказчиком
    navigation.navigate('Чат', {
      conversationId: null, // будет создан в ChatScreen
      otherUserId: item.application.user._id,
      otherUserName: `${item.application.user.surname} ${item.application.user.name}`,
      applicationId: item.application._id,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handleOpenApplication(item)}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.appTitle} numberOfLines={2}>
            {item.application?.title || 'Заказ'}
          </Text>
          <Text style={styles.responseStatus}>Вы откликнулись</Text>
        </View>
        <Text style={styles.price}>{item.application?.summ} ₸</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.application?.info || 'Нет описания'}
      </Text>

      {item.application?.city && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.infoText}>{item.application.city}</Text>
        </View>
      )}

      {item.price && (
        <View style={styles.priceRow}>
          <Ionicons name="cash-outline" size={14} color="#EC1B23" />
          <Text style={styles.yourPrice}>Ваше предложение: {item.price} ₸</Text>
        </View>
      )}

      {item.message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageLabel}>Ваш комментарий</Text>
          <Text style={styles.messageText} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.statusSection}>
          {item.application?.status === 'completed' && (
            <View style={[styles.badge, styles.completedBadge]}>
              <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
              <Text style={styles.badgeText}>Завершено</Text>
            </View>
          )}
          {item.application?.status === 'in_progress' && (
            <View style={[styles.badge, styles.progressBadge]}>
              <Ionicons name="timer-outline" size={12} color="#2196F3" />
              <Text style={styles.badgeText}>В работе</Text>
            </View>
          )}
          {item.application?.status === 'new' && (
            <View style={[styles.badge, styles.newBadge]}>
              <Ionicons name="star-outline" size={12} color="#FFC107" />
              <Text style={styles.badgeText}>Новый</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleOpenChat(item)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#EC1B23" />
          <Text style={styles.chatButtonText}>Чат</Text>
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

  if (responses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="send-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Нет отправленных откликов</Text>
        <Text style={styles.emptySubtext}>Отклики на заказы появятся здесь</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={responses}
      keyExtractor={(item) => item._id}
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
  appTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    lineHeight: 20,
  },
  responseStatus: {
    fontSize: 12,
    color: '#EC1B23',
    fontWeight: '600',
    marginTop: 4,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  yourPrice: {
    fontSize: 12,
    color: '#EC1B23',
    fontWeight: '600',
    marginLeft: 6,
  },
  messageBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  messageLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
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
  statusSection: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadge: {
    backgroundColor: '#FFF9C4',
  },
  progressBadge: {
    backgroundColor: '#E3F2FD',
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EC1B23',
  },
});
