import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';
import { getAvatarUri } from '../utils/imageUri';

const ResponsesViewScreen = ({ route, navigation }) => {
  const { applicationId, applicationTitle } = route.params;
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadResponses();
    });
    return unsubscribe;
  }, [navigation, applicationId]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/applications/${applicationId}/responses`);
      const list = response?.data?.data || response?.data || [];
      if (Array.isArray(list)) setResponses(list); else setResponses([]);

      // Также загрузим информацию о самом заказе
      const appResponse = await apiClient.get(`/api/applications/${applicationId}`);
      const app = appResponse?.data?.data || appResponse?.data || null;
      if (app) setApplication(app);
    } catch (error) {
      console.error('Error loading responses:', error);
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

  const handleContactSpecialist = async (specialistId, specialistName) => {
    try {
      const currentUser = await AsyncStorage.getItem('@currentUser');
      if (!currentUser) {
        Alert.alert('Ошибка', 'Пользователь не найден');
        return;
      }

      const user = JSON.parse(currentUser);
      
      // Переходим в чат с этим специалистом
      navigation.navigate('ChatScreen', {
        conversationId: null, // Будет создан новый чат
        otherUserId: specialistId,
        otherUserName: specialistName,
        applicationId: applicationId,
      });
    } catch (error) {
      console.error('Error navigating to chat:', error);
      Alert.alert('Ошибка', 'Не удалось открыть чат');
    }
  };

  const handleViewProfile = (specialistId, specialistName) => {
    navigation.navigate('SpecialistProfileView', {
      userId: specialistId,
      userName: specialistName,
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i < roundedRating ? 'star' : 'star-outline'}
          size={14}
          color="#FFD700"
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const renderResponseItem = ({ item }) => {
    return (
      <View style={styles.responseCard}>
        {/* Header: Specialist Info - Tap to view profile */}
        <TouchableOpacity
          onPress={() => handleViewProfile(item.specialist._id, item.specialist.name)}
          style={styles.specialistHeader}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {getAvatarUri(item.specialist) ? (
              <Image
                source={{ uri: getAvatarUri(item.specialist) }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color="#999" />
              </View>
            )}
          </View>

          {/* Specialist Info */}
          <View style={styles.specialistInfo}>
            <Text style={styles.specialistName}>{item.specialist.name}</Text>
            <Text style={styles.specialistCity}>
              {(item.specialist.city && (item.specialist.city.name || item.specialist.city)) || 'Город не указан'}
            </Text>
            <View style={styles.ratingContainer}>
              <View style={styles.starsRow}>
                {renderStars(item.specialist.rating)}
              </View>
              <Text style={styles.ratingText}>
                {item.specialist.rating ? item.specialist.rating.toFixed(1) : '0'} ({item.specialist.reviewCount || 0})
              </Text>
            </View>
          </View>

          {/* Arrow indicator */}
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Response Details */}
        <View style={styles.responseDetails}>
          {/* Offered Price and Duration */}
          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Предложена цена</Text>
              <Text style={styles.priceValue}>
                {item.offeredPrice ? `${item.offeredPrice} ₸` : 'Не указана'}
              </Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Сроки</Text>
              <Text style={styles.priceValue}>
                {item.estimatedDuration || 'Не указаны'}
              </Text>
            </View>
          </View>

          {/* Response Description */}
          {item.description && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Комментарий специалиста</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          )}

          {/* Response Date */}
          <Text style={styles.responseDate}>
            {new Date(item.createdAt).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Chat Button Only */}
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() =>
            handleContactSpecialist(item.specialist._id, item.specialist.name)
          }
        >
          <Ionicons name="chatbubbles" size={16} color="#fff" />
          <Text style={styles.contactButtonText}>Написать сообщение</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="mail-open-outline" size={64} color="#DDD" />
        <Text style={styles.emptyTitle}>Пока нет откликов</Text>
        <Text style={styles.emptyText}>
          Когда специалисты увидят ваш заказ, их предложения появятся здесь
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Отклики</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Отклики</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Application Info Card */}
      {application && (
        <View style={styles.applicationCard}>
          <Text style={styles.applicationTitle}>{application.title}</Text>
          <Text style={styles.applicationBudget}>
            Бюджет: {application.summ} ₸
          </Text>
        </View>
      )}

      {/* Responses List */}
      <FlatList
        data={responses}
        renderItem={renderResponseItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        onRefresh={onRefresh}
        refreshing={refreshing}
        scrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  applicationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EC1B23',
  },
  applicationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  applicationBudget: {
    fontSize: 12,
    color: '#666',
  },
  responseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 4,
    marginVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  specialistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialistInfo: {
    flex: 1,
  },
  specialistName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  specialistCity: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
  },
  responseDetails: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceBox: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  descriptionBox: {
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  responseDate: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 8,
  },
  contactButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: '#EC1B23',
    borderRadius: 6,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});

export default ResponsesViewScreen;
