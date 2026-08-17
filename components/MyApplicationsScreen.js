import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';

const MyApplicationsScreen = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const getUserId = (user) => user?._id || user?.id;

  const resolveCurrentUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('@currentUser');
      const fallbackUserStr = await AsyncStorage.getItem('@userData');
      const raw = userStr || fallbackUserStr;
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = { ...parsed, _id: parsed?._id || parsed?.id };
        if (normalized._id) {
          setCurrentUser(normalized);
          return normalized;
        }
      }

      const meRes = await apiClient.get('/api/users/me');
      const meUser = meRes?.data?.data || meRes?.data || null;
      if (meUser) {
        const normalized = { ...meUser, _id: meUser._id || meUser.id };
        await AsyncStorage.setItem('@currentUser', JSON.stringify(normalized));
        await AsyncStorage.setItem('@userData', JSON.stringify(normalized));
        setCurrentUser(normalized);
        return normalized;
      }
    } catch (error) {
      console.warn('Current user resolve failed:', error?.response?.status || error?.message);
    }

    return null;
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const user = await resolveCurrentUser();
      if (!user) {
        Alert.alert('Ошибка', 'Пользователь не авторизован. Пожалуйста, войдите заново.');
        return;
      }

      const userId = getUserId(user);
      if (!userId) {
        Alert.alert('Ошибка', 'Не удалось определить ID пользователя. Пожалуйста, войдите заново.');
        return;
      }

      const response = await apiClient.get(`/api/applications/user/${userId}`);
      const apps = response?.data?.data || response?.data || [];

      if (Array.isArray(apps)) {
        const enrichedApps = await Promise.all(apps.map(async (app) => {
          try {
            const responsesRes = await apiClient.get(`/api/applications/${app._id}/responses`);
            const list = responsesRes?.data?.data || responsesRes?.data || [];
            return { ...app, responses: Array.isArray(list) ? list : [] };
          } catch (error) {
            console.log('Failed to load responses for application', app._id, error?.response?.status);
            return { ...app, responses: [] };
          }
        }));

        setApplications(enrichedApps);
        applyFilter(enrichedApps, selectedFilter);
      }
    } catch (error) {
      console.error('Error loading applications:', error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 400) {
        Alert.alert('Ошибка', 'Неверный ID пользователя. Пожалуйста, перезагрузитесь.');
      } else if (error.response?.status === 401) {
        Alert.alert('Ошибка', 'Сессия истекла. Пожалуйста, переавторизуйтесь.');
      } else {
        Alert.alert('Ошибка', 'Не удалось загрузить заявки. Проверьте интернет-соединение.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const matchesStatusFilter = (app, filter) => {
    if (filter === 'all') return true;
    if (filter === 'completed') {
      return ['completed', 'closed'].includes(app?.status);
    }
    return app?.status === filter;
  };

  const applyFilter = (apps, filter) => {
    setFilteredApplications(apps.filter(app => matchesStatusFilter(app, filter)));
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    applyFilter(applications, filter);
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Открыта',
      new: 'Новая',
      in_progress: 'В работе',
      agreed: 'Согласовано',
      completed: 'Завершено',
      closed: 'Завершено',
      cancelled: 'Отменено',
    };
    return labels[status] || 'Открыта';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#FF9800',
      new: '#FF9800',
      in_progress: '#2196F3',
      agreed: '#4CAF50',
      completed: '#4CAF50',
      closed: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#999';
  };

  const getAssignmentState = (item) => {
    if (item?.currentSpecialist) {
      return { type: 'assigned', label: 'Специалист назначен' };
    }
    if (item?.pendingSpecialistConfirmation && item?.proposedSpecialist) {
      return { type: 'pending', label: 'Ожидаем подтверждение специалиста' };
    }
    return null;
  };

  const getModeLabel = (mode) => {
    return mode === 'proposal' ? '📧 Предложение' : '📝 Заказ';
  };

  const handleOpenChat = (application) => {
    const specialistId = application.currentSpecialist || application.proposedSpecialist;
    if (!specialistId) {
      Toast.warning('Специалист еще не выбран');
      return;
    }
    navigation.navigate('ChatScreen', {
      conversationId: null,
      otherUserId: typeof specialistId === 'object' ? (specialistId._id || specialistId.id) : specialistId,
      otherUserName: typeof specialistId === 'object' ? `${specialistId.surname || ''} ${specialistId.name || ''}`.trim() || 'Специалист' : 'Специалист',
      applicationId: application._id,
      applicationTitle: application?.title || 'Заявка',
    });
  };

  const handleOpenResponseChat = (application, response) => {
    const specialist = response?.specialist || {};
    const specialistId = specialist._id || specialist.id || response?.specialist;
    if (!specialistId) {
      Toast.warning('Специалист не найден');
      return;
    }

    navigation.navigate('ChatScreen', {
      conversationId: null,
      otherUserId: specialistId,
      otherUserName: `${specialist.surname || ''} ${specialist.name || ''}`.trim() || 'Специалист',
      applicationId: application._id,
      applicationTitle: application?.title || 'Заявка',
    });
  };

  const handleOpenSpecialistProfile = (response) => {
    const specialist = response?.specialist || {};
    const specialistId = specialist._id || specialist.id || response?.specialist;
    if (!specialistId) {
      Toast.warning('Профиль специалиста недоступен');
      return;
    }

    navigation.navigate('SpecialistProfileView', {
      userId: specialistId,
      userName: `${specialist.surname || ''} ${specialist.name || ''}`.trim() || 'Специалист',
    });
  };

  const renderApplicationItem = ({ item }) => {
    const assignmentState = getAssignmentState(item);
    const hasSelectedSpecialist = Boolean(item.currentSpecialist || (item.pendingSpecialistConfirmation && item.proposedSpecialist));

    return (
      <View style={styles.applicationCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item._id })}
          activeOpacity={0.8}
        >
          <View style={styles.cardTop}>
            <View style={styles.titlePriceSection}>
              <Text style={styles.titleLarge} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.priceLarge}>
                {item.summ || '—'} ТГ
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>

          <View style={styles.cardMiddle}>
            {item.city && (
              <Text style={styles.textSmall}>
                📍 {typeof item.city === 'string' ? item.city : item.city.name || item.city}
              </Text>
            )}
            <Text style={styles.textSmall}>
              📅 {new Date(item.createdAt).toLocaleDateString('ru-RU')}
            </Text>
            <Text style={styles.textSmall}>
              💬 {item.responses?.length || 0} откликов
            </Text>
          </View>
        </TouchableOpacity>

        {assignmentState && (
          <View style={[styles.assignmentBanner, assignmentState.type === 'pending' ? styles.assignmentBannerPending : styles.assignmentBannerAssigned]}>
            <Text style={styles.assignmentBannerText}>{assignmentState.label}</Text>
          </View>
        )}

        {Array.isArray(item.responses) && item.responses.length > 0 && (
          <View style={styles.responsesSection}>
            <Text style={styles.responsesTitle}>Отклики специалистов</Text>
            {item.responses.slice(0, 3).map((response) => {
              const specialist = response.specialist || {};
              const specialistId = specialist._id || specialist.id || response.specialist;
              const specialistName = `${specialist.surname || ''} ${specialist.name || ''}`.trim() || 'Специалист';
              const responseStatus = response.status === 'accepted' ? 'Принято' : response.status === 'pending' ? 'На рассмотрении' : 'Отклик';
              const responseText = response.message || 'Комментарий не добавлен';

              return (
                <View key={response._id} style={styles.responseCard}>
                  <TouchableOpacity
                    style={styles.responseHeader}
                    onPress={() => handleOpenResponseChat(item, response)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.responseAvatar}>
                      <Text style={styles.responseAvatarText}>{(specialist.name || 'С')[0]?.toUpperCase() || 'С'}</Text>
                    </View>
                    <View style={styles.responseInfo}>
                      <Text style={styles.responseName}>{specialistName}</Text>
                      <Text style={styles.responseMeta}>{responseStatus}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>

                  <Text style={styles.responseText} numberOfLines={2}>{responseText}</Text>

                  <Text style={styles.responseDate}>
                    {response.createdAt ? new Date(response.createdAt).toLocaleDateString('ru-RU') : 'Дата не указана'}
                  </Text>

                  <View style={styles.responseActionRow}>
                    <TouchableOpacity
                      style={[styles.smallActionButton, styles.secondaryButton, styles.fullWidthButton]}
                      onPress={() => handleOpenSpecialistProfile(response)}
                    >
                      <Text style={styles.smallActionText}>Посмотреть профиль</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {hasSelectedSpecialist && (
          <View style={styles.cardBottom}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => handleOpenChat(item)}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#fff" />
              <Text style={styles.chatButtonText}>{item.pendingSpecialistConfirmation ? 'Подтвердить в чате' : 'Открыть чат'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>
        {selectedFilter === 'all'
          ? 'Заявок нет'
          : `Заявок со статусом "${getStatusLabel(selectedFilter)}" нет`}
      </Text>
      <Text style={styles.emptyText}>
        Создавайте новые предложения специалистам, чтобы начать сотрудничество
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('SpecialistsCatalogScreen')}
      >
        <Text style={styles.createButtonText}>Найти специалиста</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Мои заявки</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мои заявки</Text>
      </View>

      {/* Фильтр */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            Все
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'new' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('new')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === 'new' && styles.filterButtonTextActive,
            ]}
          >
            Новые
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'in_progress' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('in_progress')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === 'in_progress' && styles.filterButtonTextActive,
            ]}
          >
            В работе
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'completed' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('completed')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === 'completed' && styles.filterButtonTextActive,
            ]}
          >
            Завершено
          </Text>
        </TouchableOpacity>
      </View>

      {/* Список заявок */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    gap: 6,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#fff',
    minHeight: 28,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#EC1B23',
    borderColor: '#EC1B23',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responsesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  responsesTitle: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  responseAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EC1B23',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  responseAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  responseInfo: {
    flex: 1,
  },
  responseName: {
    fontSize: 13,
    color: '#222',
    fontWeight: '600',
  },
  responseMeta: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  titlePriceSection: {
    flex: 1,
    marginRight: 8,
  },
  titleLarge: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  priceLarge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EC1B23',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 0,
    alignSelf: 'center',
    maxWidth: 110,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  assignmentBanner: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  assignmentBannerPending: {
    backgroundColor: '#FFF3E0',
  },
  assignmentBannerAssigned: {
    backgroundColor: '#E8F5E9',
  },
  assignmentBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  cardMiddle: {
    marginBottom: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  textSmall: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
    fontWeight: '500',
  },
  cardBottom: {
    marginTop: 8,
  },
  responseCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  responseInfo: {
    flex: 1,
  },
  responseText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 17,
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 10,
    color: '#888',
    marginBottom: 6,
  },
  responseActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  smallActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  fullWidthButton: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#EC1B23',
  },
  secondaryButton: {
    backgroundColor: '#F1F1F1',
  },
  smallActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EC1B23',
    gap: 6,
  },
  chatButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#EC1B23',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MyApplicationsScreen;
