import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';

const { width } = Dimensions.get('window');

const HomeCustomer = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeApplications: 0,
    completedApplications: 0,
    unreadChats: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const userStr = await AsyncStorage.getItem('@currentUser');
      const fallbackUserStr = await AsyncStorage.getItem('@userData');
      const rawUser = userStr || fallbackUserStr;

      if (!rawUser) {
        setUser(null);
        setStats({ totalApplications: 0, activeApplications: 0, completedApplications: 0, unreadChats: 0 });
        setRecentApplications([]);
        return;
      }

      const currentUser = JSON.parse(rawUser);
      const currentUserId = currentUser?._id || currentUser?.id;
      setUser(currentUser);

      if (!currentUserId) {
        setStats({ totalApplications: 0, activeApplications: 0, completedApplications: 0, unreadChats: 0 });
        setRecentApplications([]);
        return;
      }

      const appsRes = await apiClient.get(`/api/applications/user/${currentUserId}`);
      const userApps = appsRes?.data?.data || appsRes?.data || [];

      if (Array.isArray(userApps)) {
        const normalizeStatus = (status) => {
          const value = String(status || '').toLowerCase();
          if (['new', 'open'].includes(value)) return 'open';
          if (['agreed', 'in_progress'].includes(value)) return 'in_progress';
          if (['completed', 'closed', 'cancelled'].includes(value)) return 'closed';
          return value || 'open';
        };

        const stats = {
          totalApplications: userApps.length,
          activeApplications: userApps.filter((app) => ['open', 'in_progress'].includes(normalizeStatus(app.status))).length,
          completedApplications: userApps.filter((app) => normalizeStatus(app.status) === 'closed').length,
          unreadChats: 0,
        };

        setStats(stats);

        const recent = userApps.slice(0, 3).map((app) => ({
          _id: app._id,
          title: app.title,
          status: app.status,
          budgetMin: app.budgetMin,
          budgetMax: app.budgetMax,
          createdAt: app.createdAt,
          responsesCount: Array.isArray(app.responses) ? app.responses.length : 0,
        }));
        setRecentApplications(recent);
      } else {
        setStats({ totalApplications: 0, activeApplications: 0, completedApplications: 0, unreadChats: 0 });
        setRecentApplications([]);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      Toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'closed':
        return '#999';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Открыта';
      case 'in_progress':
        return 'В процессе';
      case 'closed':
        return 'Закрыта';
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Добро пожаловать, {user?.name || 'гость'}!</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="document-outline" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{stats.totalApplications}</Text>
            <Text style={styles.statLabel}>Заявок</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="flash-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{stats.activeApplications}</Text>
            <Text style={styles.statLabel}>Активных</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{stats.completedApplications}</Text>
            <Text style={styles.statLabel}>Завершено</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Создать заказ')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EC1B23' }]}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Создать{'\n'}заказ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SpecialistsCatalog')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="search-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Каталог{'\n'}специалистов</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Мои заявки')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="list-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Мои{'\n'}заявки</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Чаты')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="chatbubble-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Чаты</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Applications */}
        {recentApplications.length > 0 && (
          <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Последние заявки</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Мои заявки')}>
                <Text style={styles.seeAllLink}>Все</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.applicationsList}>
              {recentApplications.map((app) => (
                <TouchableOpacity
                  key={app._id}
                  style={styles.appCard}
                  onPress={() =>
                    navigation.navigate('ApplicationDetailScreen', { applicationId: app._id })
                  }
                >
                  <View style={styles.appContent}>
                    <Text style={styles.appTitle} numberOfLines={1}>
                      {app.title}
                    </Text>
                    <Text style={styles.appMeta}>
                      {app.budgetMin > 0 && app.budgetMax > 0
                        ? `${app.budgetMin} - ${app.budgetMax} ₸`
                        : 'Бюджет не указан'}
                    </Text>
                    <Text style={styles.appDate}>💬 {app.responsesCount || 0} откликов</Text>
                    <Text style={styles.appDate}>{formatDate(app.createdAt)}</Text>
                  </View>
                  <View style={styles.appStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(app.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusText(app.status)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {stats.totalApplications === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Нет заявок</Text>
            <Text style={styles.emptyText}>Создайте вашу первую заявку, чтобы начать</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Создать заказ')}
            >
              <Text style={styles.emptyButtonText}>Создать заявку</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  recentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 12,
    color: '#EC1B23',
    fontWeight: '600',
  },
  applicationsList: {
    gap: 8,
  },
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appContent: {
    flex: 1,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  appDate: {
    fontSize: 11,
    color: '#999',
  },
  appStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#EC1B23',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HomeCustomer;
