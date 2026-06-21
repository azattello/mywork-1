import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import SearchFilterBar from './SearchFilterBar';
import { Toast } from '../utils/ToastManager';
import { SkeletonCard } from './SkeletonLoader';

const AvailableApplicationsScreen = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [responseData, setResponseData] = useState({
    offeredPrice: '',
    estimatedDuration: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        // Load available applications for specialist's categories
        const response = await apiClient.get('/api/applications', {
          params: {
            status: 'open',
          },
        });

        const list = response?.data?.data || response?.data || [];
        if (Array.isArray(list)) {
          setApplications(list);
          setFilteredApps(list);
        } else {
          setApplications([]);
          setFilteredApps([]);
        }
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      Toast.error('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    Toast.success('Обновлено');
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredApps(applications);
    } else {
      const filtered = applications.filter(
        (app) =>
          app.title.toLowerCase().includes(text.toLowerCase()) ||
          app.info?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  };

  const handleResponsePress = (app) => {
    setSelectedApp(app);
    setResponseData({
      offeredPrice: '',
      estimatedDuration: '',
      description: '',
    });
    setResponseModalVisible(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseData.offeredPrice.trim() || !currentUser) {
      Alert.alert('Ошибка', 'Укажите предлагаемую цену');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post(`/api/applications/${selectedApp._id}/respond`, {
        specialistId: currentUser._id,
        offeredPrice: parseFloat(responseData.offeredPrice),
        estimatedDuration: responseData.estimatedDuration,
        description: responseData.description,
      });

      if (response.data && response.data.success) {
        Alert.alert('Успех', 'Ваш отклик отправлен!');
        setResponseModalVisible(false);
        
        // Remove from list or mark as responded
        setApplications(
          applications.filter((app) => app._id !== selectedApp._id)
        );
        setFilteredApps(
          filteredApps.filter((app) => app._id !== selectedApp._id)
        );
      } else {
        const errorMsg = response.data?.message || 'Ошибка при отправке отклика';
        Toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Не удалось отправить отклик';
      Toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderApplicationItem = ({ item }) => (
    <View style={styles.applicationCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.appCity}>
            <Ionicons name="location" size={12} color="#999" /> {((item.city && typeof item.city === 'object') ? item.city.name : item.city) || 'Город не указан'}
          </Text>
        </View>
        <View style={styles.budgetBox}>
          <Text style={styles.budgetLabel}>Бюджет</Text>
          <Text style={styles.budgetValue}>{item.summ} ₸</Text>
        </View>
      </View>

      {/* Description */}
      {item.info && (
        <Text style={styles.appDescription} numberOfLines={3}>
          {item.info}
        </Text>
      )}

      {/* Categories */}
          {item.categories && item.categories.length > 0 && (
        <View style={styles.categoriesRow}>
          {item.categories.slice(0, 3).map((cat) => (
            <View key={cat} style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{cat}</Text>
            </View>
          ))}
          {item.categories.length > 3 && (
            <Text style={styles.moreCategoriesText}>
              +{item.categories.length - 3}
            </Text>
          )}
        </View>
      )}

      {/* Date and responses count */}
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('ru-RU', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        {item.responseCount && (
          <Text style={styles.responsesCount}>
            {item.responseCount} откликов
          </Text>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.respondButton}
        onPress={() => handleResponsePress(item)}
      >
        <Ionicons name="send" size={14} color="#fff" />
        <Text style={styles.respondButtonText}>Отправить отклик</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="inbox-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>Нет доступных заказов</Text>
      <Text style={styles.emptyText}>
        Когда появятся новые заказы в ваших категориях, они будут показаны здесь
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <SearchFilterBar placeholder="Поиск заказа..." showFilters={false} onSearch={handleSearch} />
        <View style={styles.centerContent}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchFilterBar
        placeholder="Поиск заказа..."
        onSearch={handleSearch}
        showFilters={false}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Доступные заказы</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск заказа..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Applications List */}
      <FlatList
        data={filteredApps}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {/* Response Modal */}
      <Modal
        visible={responseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setResponseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setResponseModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Отправить отклик</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Application Info */}
              {selectedApp && (
                <View style={styles.appInfoBox}>
                  <Text style={styles.appInfoTitle}>{selectedApp.title}</Text>
                  <Text style={styles.appInfoDetail}>
                    Бюджет: {selectedApp.summ} ₸
                  </Text>
                  {selectedApp.city && (
                    <Text style={styles.appInfoDetail}>
                      Город: {((selectedApp.city && typeof selectedApp.city === 'object') ? selectedApp.city.name : selectedApp.city) || 'Город не указан'}
                    </Text>
                  )}
                </View>
              )}

              {/* Price Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Предлагаемая цена (₸) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Введите сумму"
                  placeholderTextColor="#999"
                  value={responseData.offeredPrice}
                  onChangeText={(text) =>
                    setResponseData({ ...responseData, offeredPrice: text })
                  }
                  keyboardType="decimal-pad"
                  editable={!submitting}
                />
              </View>

              {/* Duration Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Примерные сроки (дни)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Например: 5-7 дней"
                  placeholderTextColor="#999"
                  value={responseData.estimatedDuration}
                  onChangeText={(text) =>
                    setResponseData({ ...responseData, estimatedDuration: text })
                  }
                  editable={!submitting}
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Комментарий</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Расскажите о вашем опыте и подходе к работе"
                  placeholderTextColor="#999"
                  value={responseData.description}
                  onChangeText={(text) =>
                    setResponseData({ ...responseData, description: text })
                  }
                  multiline
                  numberOfLines={4}
                  editable={!submitting}
                />
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setResponseModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitResponse}
                disabled={submitting || !responseData.offeredPrice.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Отправить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    lineHeight: 18,
    marginBottom: 4,
  },
  appCity: {
    fontSize: 12,
    color: '#999',
  },
  budgetBox: {
    alignItems: 'center',
    marginLeft: 8,
  },
  budgetLabel: {
    fontSize: 10,
    color: '#999',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EC1B23',
    marginTop: 2,
  },
  appDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#666',
  },
  moreCategoriesText: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  responsesCount: {
    fontSize: 11,
    color: '#666',
  },
  respondButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#EC1B23',
    borderRadius: 6,
  },
  respondButtonText: {
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appInfoBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  appInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  appInfoDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#F8F8F8',
  },
  textArea: {
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#EC1B23',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

export default AvailableApplicationsScreen;
