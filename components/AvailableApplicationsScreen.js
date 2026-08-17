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
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';
import { SkeletonCard } from './SkeletonLoader';

const { width, height } = Dimensions.get('window');

const AvailableApplicationsScreen = ({ navigation, route }) => {
  const { categoryId, categoryName, searchQuery } = route.params || {};
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
  const [searchText, setSearchText] = useState(searchQuery || '');

  useEffect(() => {
    loadData();
  }, [categoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        const response = await apiClient.get('/api/applications', {
          params: {
            status: 'open',
          },
        });

        let list = response?.data?.data || response?.data || [];
        if (Array.isArray(list)) {
          // Filter by category if provided
          if (categoryId) {
            list = list.filter(app => {
              if (!app.categories) return false;
              return app.categories.some(cat => {
                const catId = cat._id || cat.id || cat;
                return String(catId) === String(categoryId);
              });
            });
          }

          // Filter by search query if provided
          if (searchQuery) {
            list = list.filter(app =>
              (app.title && app.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (app.info && app.info.toLowerCase().includes(searchQuery.toLowerCase()))
            );
          }

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
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredApps(applications);
    } else {
      const filtered = applications.filter(
        (app) =>
          (app.title && app.title.toLowerCase().includes(text.toLowerCase())) ||
          (app.info && app.info.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredApps(filtered);
    }
  };

  const handleApplicationPress = (app) => {
    navigation.navigate('ApplicationDetail', { applicationId: app._id });
  };

  const handleResponsePress = (app) => {
    navigation.navigate('CreateResponse', { applicationId: app._id });
  };

  const handleSubmitResponse = async () => {
    if (!responseData.offeredPrice.trim()) {
      Toast.warning('Укажите предлагаемую цену');
      return;
    }

    if (isNaN(parseFloat(responseData.offeredPrice))) {
      Toast.warning('Цена должна быть числом');
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
        Toast.success('Ваш отклик отправлен!');
        setResponseModalVisible(false);
        
        // Remove from list
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

  const getCityName = (city) => {
    if (!city) return 'Не указан';
    if (typeof city === 'string') return city;
    if (typeof city === 'object') return city.name || 'Не указан';
    return 'Не указан';
  };

  const getCategoryNames = (categories) => {
    if (!categories || categories.length === 0) return 'Нет категорий';
    return categories
      .map(cat => {
        if (typeof cat === 'string') return cat;
        if (typeof cat === 'object') return cat.name || cat._id;
        return String(cat);
      })
      .join(', ');
  };

  const renderApplicationItem = ({ item }) => {
    const cityName = getCityName(item.city);
    const categoryNames = getCategoryNames(item.categories);

    return (
      <TouchableOpacity
        style={styles.applicationCard}
        onPress={() => handleApplicationPress(item)}
        activeOpacity={0.7}
      >
        {/* Title and Price */}
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.appTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.price}>{item.summ || '?'} ₸</Text>
        </View>

        {/* Description */}
        {item.info && (
          <Text style={styles.description} numberOfLines={2}>
            {item.info}
          </Text>
        )}

        {/* City and Categories */}
        <View style={styles.infoRowsContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#EC1B23" />
            <Text style={styles.infoText}>{cityName}</Text>
          </View>
          <View style={styles.categoriesRow}>
            <Ionicons name="pricetag-outline" size={14} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              {categoryNames}
            </Text>
          </View>
        </View>

        {/* Deadline if exists */}
        {item.deadline && (
          <View style={styles.deadlineRow}>
            <Ionicons name="calendar-outline" size={14} color="#999" />
            <Text style={styles.infoText}>
              До {new Date(item.deadline).toLocaleDateString('ru-RU')}
            </Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={styles.respondButton}
          onPress={() => handleResponsePress(item)}
        >
          <Ionicons name="send" size={16} color="#fff" />
          <Text style={styles.respondButtonText}>Отправить отклик</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#ddd" style={{ marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>Заказы не найдены</Text>
      <Text style={styles.emptySub}>
        {categoryName
          ? `В категории "${categoryName}" пока нет заказов`
          : 'Попробуйте изменить фильтр или вернитесь позже'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {categoryName ? `${categoryName}` : 'Лента заказов'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerLoading}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryName ? `${categoryName}` : 'Лента заказов'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons size={18} color="#999" name="search-outline" />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск заказов..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons size={18} color="#999" name="close-circle" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Applications List */}
      <FlatList
        data={filteredApps}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EC1B23"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Response Modal */}
      <Modal
        visible={responseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setResponseModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Отправить отклик</Text>
              <TouchableOpacity
                onPress={() => setResponseModalVisible(false)}
              >
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Selected Application Info */}
            {selectedApp && (
              <View style={styles.selectedAppInfo}>
                <Text style={styles.selectedAppTitle} numberOfLines={2}>
                  {selectedApp.title}
                </Text>
                <Text style={styles.selectedAppPrice}>
                  Бюджет: {selectedApp.summ} ₸
                </Text>
              </View>
            )}

            {/* Form */}
            <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Ваша предложенная цена *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Введите цену в тенге"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={responseData.offeredPrice}
                  onChangeText={(price) =>
                    setResponseData({ ...responseData, offeredPrice: price })
                  }
                />
                <Text style={styles.inputSuffix}>₸</Text>
              </View>

              <Text style={styles.formLabel}>Примерный срок выполнения</Text>
              <TextInput
                style={styles.input}
                placeholder="Например: 3 дня, 1 неделя"
                placeholderTextColor="#999"
                value={responseData.estimatedDuration}
                onChangeText={(duration) =>
                  setResponseData({ ...responseData, estimatedDuration: duration })
                }
              />

              <Text style={styles.formLabel}>Ваше предложение (опционально)</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Расскажите почему вы подходите для этого заказа..."
                placeholderTextColor="#999"
                value={responseData.description}
                onChangeText={(desc) =>
                  setResponseData({ ...responseData, description: desc })
                }
                multiline
                numberOfLines={5}
              />
            </ScrollView>

            {/* Buttons */}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setResponseModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitResponse}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>Отправить</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: '#000',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    lineHeight: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EC1B23',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  infoRowsContainer: {
    marginBottom: 8,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC1B23',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  respondButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: height * 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 'auto',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  selectedAppInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  selectedAppTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  selectedAppPrice: {
    fontSize: 13,
    color: '#EC1B23',
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EC1B23',
    marginLeft: 4,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#F2F2F2',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#EC1B23',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AvailableApplicationsScreen;
