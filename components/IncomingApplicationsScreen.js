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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import SearchFilterBar from './SearchFilterBar';
import { Toast } from '../utils/ToastManager';
import { SkeletonCard } from './SkeletonLoader';

const IncomingApplicationsScreen = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        const response = await apiClient.get(`/api/applications/specialist/${user._id}`);
        const apps = response?.data?.data || response?.data || [];
        if (Array.isArray(apps)) {
          setApplications(apps);
          setFilteredApps(apps);
        }
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      Toast.error('Не удалось загрузить предложения');
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

  const handleSearch = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredApps(applications);
    } else {
      const filtered = applications.filter(app =>
        app.title?.toLowerCase().includes(text.toLowerCase()) ||
        app.info?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  };

  const handleAccept = async (applicationId) => {
    try {
      const response = await apiClient.put(`/api/applications/${applicationId}/status`, {
        status: 'agreed',
      });
      if (response.data && response.data.success) {
        Toast.success('Вы приняли предложение');
        await loadApplications();
      }
    } catch (error) {
      console.error('Error accepting application:', error);
      Toast.error('Не удалось принять предложение');
    }
  };

  const handleReject = async (applicationId) => {
    Toast.warning('Отклонение предложения - скоро');
  };

  const handleOpenChat = (application) => {
    navigation.navigate('ChatScreen', {
      conversationId: null,
      otherUserId: application.user._id,
      otherUserName: `${application.user.surname} ${application.user.name}`,
      applicationId: application._id,
    });
  };

  const getModeLabel = (mode) => {
    return mode === 'proposal' ? '📧 Предложение' : '📝 Заказ';
  };

  const getStatusColor = (status) => {
    const colors = {
      new: '#FF9800',
      in_progress: '#2196F3',
      agreed: '#4CAF50',
      completed: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: 'Новая',
      in_progress: 'В работе',
      agreed: 'Согласовано',
      completed: 'Завершено',
      cancelled: 'Отменено',
    };
    return labels[status] || status;
  };

  const renderApplicationItem = ({ item }) => (
    <View style={styles.applicationCard}>
      {/* Customer info */}
      <View style={styles.customerSection}>
        {item.user.avatar ? (
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color="#999" />
          </View>
        )}
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {item.user.surname} {item.user.name}
          </Text>
          {item.user.city && (
            <Text style={styles.customerCity}>📍 {typeof item.user.city === 'string' ? item.user.city : item.user.city.name}</Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      {/* Title and mode */}
      <View style={styles.titleSection}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.mode}>{getModeLabel(item.mode)}</Text>
      </View>

      {/* Description */}
      {item.info && (
        <Text style={styles.description} numberOfLines={2}>
          {item.info}
        </Text>
      )}

      {/* Date */}
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString('ru-RU')}
      </Text>

      {/* Actions */}
      {item.status === 'new' ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(item._id)}
          >
            <Ionicons name="close" size={18} color="#999" />
            <Text style={styles.rejectButtonText}>Отклонить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAccept(item._id)}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.acceptButtonText}>Принять</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, styles.chatButton]}
          onPress={() => handleOpenChat(item)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#EC1B23" />
          <Text style={styles.chatButtonText}>Открыть чат</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mail-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>Нет входящих предложений</Text>
      <Text style={styles.emptyText}>
        Когда заказчики отправят вам предложения, они появятся здесь
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SearchFilterBar placeholder="Поиск предложения..." showFilters={false} onSearch={handleSearch} />
        <View style={styles.centerContent}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SearchFilterBar
        placeholder="Поиск предложения..."
        onSearch={handleSearch}
        showFilters={false}
      />

      <FlatList
        data={filteredApps}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC1B23" />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  badge: {
    backgroundColor: '#EC1B23',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EC1B23',
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  customerCity: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  mode: {
    fontSize: 11,
    color: '#666',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  date: {
    fontSize: 11,
    color: '#999',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#EC1B23',
  },
  acceptButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  rejectButtonText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: '#FFF0F2',
    borderWidth: 1,
    borderColor: '#EC1B23',
  },
  chatButtonText: {
    fontSize: 12,
    color: '#EC1B23',
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
  },
});

export default IncomingApplicationsScreen;
