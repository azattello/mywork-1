import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import DistanceDisplay from './DistanceDisplay';
import { getAvatarUri } from '../utils/imageUri';
import LocationPermissionModal from './LocationPermissionModal';

const SpecialistsCatalogScreen = ({ navigation }) => {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Геолокация
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Фильтры
  const [searchText, setSearchText] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [workMode, setWorkMode] = useState(null); // 'online', 'offline', 'both'
  const [sortBy, setSortBy] = useState('-rating'); // -rating, minPrice, yearsOfExperience
  const [radiusKm, setRadiusKm] = useState('50'); // Радиус в км
  
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const LIMIT = 20;

  useEffect(() => {
    loadUserLocation();
    loadData(1);
  }, []);

  // Загрузить сохраненную геолокацию пользователя
  const loadUserLocation = async () => {
    try {
      const locationData = await AsyncStorage.getItem('@userLocation');
      if (locationData) {
        const location = JSON.parse(locationData);
        // Проверить, не устарела ли локация (старше 1 часа)
        if (Date.now() - location.timestamp < 3600000) {
          setUserLocation(location);
          return;
        }
      }
      // Показать модальное окно запроса геолокации
      setShowLocationModal(true);
    } catch (error) {
      console.warn('Could not load user location:', error.message);
    }
  };

  // Загрузить специалистов с фильтрами с backend
  const loadData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      
      // Построить параметры запроса
      const params = {
        role: 'specialist',
        page: pageNum,
        limit: LIMIT,
        sort: sortBy,
      };

      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      if (selectedCity) {
        params.city = selectedCity;
      }
      if (selectedCategories.length > 0) {
        params.categories = selectedCategories.join(',');
      }
      if (minPrice) {
        params.minPrice = minPrice;
      }
      if (maxPrice) {
        params.maxPrice = maxPrice;
      }
      if (minRating) {
        params.minRating = minRating;
      }
      if (minExperience) {
        params.minExperience = minExperience;
      }
      if (workMode) {
        params.workMode = workMode;
      }

      const response = await apiClient.get('/api/users', { params });

      let users = response?.data?.data || [];
      const pagination = response?.data?.pagination || {};

      if (Array.isArray(users)) {
        // Нормализовать данные
        users = users.map(u => {
          const reviewCount = Number(u.reviewsCount ?? u.reviewCount ?? 0);
          return {
            ...u,
            rating: Number(u.rating || 0),
            reviewsCount: reviewCount,
            reviewCount,
            city: u.city && (u.city.name || u.city),
            categories: (u.categories || []).map(cat => {
              if (!cat) return null;
              if (typeof cat === 'string') return cat;
              if (typeof cat === 'object') return cat.name || cat.title;
              return String(cat);
            }).filter(Boolean),
          };
        });

        if (pageNum === 1) {
          setSpecialists(users);
        } else {
          setSpecialists(prev => [...prev, ...users]);
        }

        setPage(pageNum);
        setHasMore(pagination.hasMore || false);
        setTotal(pagination.total || 0);
      }
    } catch (error) {
      console.error('Error loading specialists:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить специалистов');
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedCity, selectedCategories, minPrice, maxPrice, minRating, minExperience, workMode, sortBy]);

  // Загрузить города и категории
  useEffect(() => {
    const loadCitiesAndCategories = async () => {
      try {
        const [citiesRes, categoriesRes] = await Promise.all([
          apiClient.get('/api/cities'),
          apiClient.get('/api/categories')
        ]);

        const citiesList = citiesRes?.data?.data || [];
        setCities(citiesList.map(c => ({ id: c._id, name: c.name, region: c.region })));

        const categoriesList = categoriesRes?.data?.data || [];
        setCategories(categoriesList.map(c => ({ id: c._id, name: c.name })));
      } catch (error) {
        console.error('Error loading cities/categories:', error);
      }
    };

    loadCitiesAndCategories();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(1);
    setRefreshing(false);
  }, [loadData]);

  const loadMore = () => {
    if (hasMore && !loading) {
      loadData(page + 1);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    setFilterModalVisible(false);
    loadData(1);
  };

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedCity(null);
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setMinExperience('');
    setWorkMode(null);
    setSortBy('-rating');
    setPage(1);
  };

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
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

  const renderSpecialistCard = ({ item }) => (
    <TouchableOpacity
      style={styles.specialistCard}
      onPress={() => handleViewProfile(item._id, item.name)}
    >
      <View style={styles.cardHeader}>
        {getAvatarUri(item) ? (
          <Image source={{ uri: getAvatarUri(item) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={32} color="#999" />
          </View>
        )}

        <View style={styles.specialistInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.specialistName} numberOfLines={1}>
              {item.surname} {item.name}
            </Text>
            {item.verification?.status === 'verified' && (
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" style={{ marginLeft: 6 }} />
            )}
          </View>
          
          {item.city && (
            <Text style={styles.specialistCity}>
              <Ionicons name="location" size={11} color="#999" /> {item.city}
            </Text>
          )}
          
          <View style={styles.ratingRow}>
            <View style={{ flexDirection: 'row' }}>
              {renderStars(item.rating)}
            </View>
            <Text style={styles.ratingText}>
              {item.rating?.toFixed(1) || '0'} ({item.reviewsCount ?? item.reviewCount ?? 0})
            </Text>
          </View>

          {item.yearsOfExperience > 0 && (
            <Text style={styles.experienceText}>
              Опыт: {item.yearsOfExperience} лет
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>

      {item.about && (
        <Text style={styles.aboutText} numberOfLines={2}>
          {item.about}
        </Text>
      )}

      {item.categories && item.categories.length > 0 && (
        <View style={styles.categoriesRow}>
          {item.categories.slice(0, 3).map((cat, idx) => (
            <View key={idx} style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{cat}</Text>
            </View>
          ))}
          {item.categories.length > 3 && (
            <Text style={styles.moreCategoriesText}>
              +{item.categories.length - 3}
            </Text>
          )}
        </View>
      )}

      {item.minPrice > 0 && (
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>
            {item.minPrice}₸ - {item.maxPrice || item.minPrice}₸
          </Text>
        </View>
      )}

      {userLocation && item.latitude && item.longitude && (
        <View style={styles.distanceRow}>
          <DistanceDisplay 
            specialistId={item._id} 
            userLocation={userLocation}
            showLabel={false}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>Специалистов не найдено</Text>
      <Text style={styles.emptyText}>
        Попробуйте изменить параметры поиска или фильтры
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={clearAllFilters}
      >
        <Text style={styles.resetButtonText}>Сбросить фильтры</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return <ActivityIndicator size="large" color="#EC1B23" style={{ marginVertical: 20 }} />;
  };

  const activeFiltersCount = (selectedCity ? 1 : 0) + selectedCategories.length + 
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (minRating ? 1 : 0) + 
    (minExperience ? 1 : 0) + (workMode ? 1 : 0);

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Специалисты</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Специалисты ({total})
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => setSortModalVisible(true)}>
            <Ionicons name="arrow-down-arrow-up" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
            <View>
              <Ionicons name="funnel" size={22} color="#000" />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по имени, фамилии, профессии..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setPage(1);
          }}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {!userLocation && (
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.9}
        >
          <View style={styles.locationBannerIcon}>
            <Ionicons name="location-outline" size={18} color="#EC1B23" />
          </View>

          <View style={styles.locationBannerTextWrap}>
            <Text style={styles.locationBannerTitle}>Геолокация</Text>
            <Text style={styles.locationBannerSubtitle}>Показать специалистов рядом</Text>
          </View>

          <View style={styles.locationBannerButton}>
            <Text style={styles.locationBannerButtonText}>Включить</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersSummary}>
          <Text style={styles.activeFiltersText}>
            Применено фильтров: {activeFiltersCount}
          </Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearAllText}>Сбросить всё</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Specialists List */}
      <FlatList
        data={specialists}
        renderItem={renderSpecialistCard}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Фильтры</Text>
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.resetText}>Сбросить</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* City Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Город</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {cities.map(city => (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.filterOption,
                      selectedCity === city.id && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedCity(selectedCity === city.id ? null : city.id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCity === city.id && styles.filterOptionTextActive
                    ]}>
                      {city.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Категория</Text>
              <View style={styles.categoryGrid}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      selectedCategories.includes(cat.id) && styles.categoryOptionActive
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      selectedCategories.includes(cat.id) && styles.categoryOptionTextActive
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Диапазон цены (₸)</Text>
              <View style={styles.priceRangeContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="От"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <Text style={styles.priceDash}>—</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="До"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Минимальный рейтинг</Text>
              <View style={styles.ratingOptions}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingOption,
                      minRating === String(rating) && styles.ratingOptionActive
                    ]}
                    onPress={() => setMinRating(minRating === String(rating) ? '' : String(rating))}
                  >
                    <Text style={styles.ratingOptionText}>★ {rating}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Опыт (лет)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Минимум лет опыта"
                keyboardType="numeric"
                value={minExperience}
                onChangeText={setMinExperience}
              />
            </View>

            {/* Radius Filter */}
            {userLocation && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Радиус поиска (км)</Text>
                <View style={styles.radiusContainer}>
                  <TextInput
                    style={styles.radiusInput}
                    placeholder="Радиус в км"
                    keyboardType="numeric"
                    value={radiusKm}
                    onChangeText={setRadiusKm}
                  />
                  <Text style={styles.radiusLabel}>{radiusKm} км</Text>
                </View>
              </View>
            )}

            {/* Work Mode Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Режим работы</Text>
              <View style={styles.workModeOptions}>
                {['online', 'offline', 'both'].map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.workModeOption,
                      workMode === mode && styles.workModeOptionActive
                    ]}
                    onPress={() => setWorkMode(workMode === mode ? null : mode)}
                  >
                    <Text style={[
                      styles.workModeText,
                      workMode === mode && styles.workModeTextActive
                    ]}>
                      {mode === 'online' ? '💻 Онлайн' : mode === 'offline' ? '📍 Офлайн' : '🔄 Оба'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
              <Text style={styles.applyButtonText}>Применить фильтры</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Location Permission Modal */}
      <LocationPermissionModal 
        visible={showLocationModal}
        onLocationReceived={(location) => setUserLocation(location)}
        onClose={() => setShowLocationModal(false)}
        isSpecialist={false}
      />

      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        animationType="slide"
        transparent={true}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSortModalVisible(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Сортировка</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            {[
              { value: '-rating', label: '⭐ Рейтинг (выше)' },
              { value: 'minPrice', label: '💰 Цена (ниже)' },
              { value: '-minPrice', label: '💰 Цена (выше)' },
              { value: '-yearsOfExperience', label: '📚 Опыт (больше)' },
              { value: '-reviewsCount', label: '💬 Отзывы (больше)' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.value);
                  setSortModalVisible(false);
                  setPage(1);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EC1B23',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: '#000',
  },
  locationBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  locationBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationBannerTextWrap: {
    flex: 1,
  },
  locationBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  locationBannerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  locationBannerButton: {
    backgroundColor: '#EC1B23',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationBannerButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  activeFiltersSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#666',
  },
  clearAllText: {
    fontSize: 12,
    color: '#EC1B23',
    fontWeight: '600',
  },
  specialistCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialistInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialistName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  specialistCity: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 6,
  },
  experienceText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  aboutText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
    lineHeight: 18,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#555',
  },
  moreCategoriesText: {
    fontSize: 11,
    color: '#999',
    paddingHorizontal: 8,
  },
  priceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EC1B23',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  resetButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EC1B23',
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modal: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  resetText: {
    fontSize: 13,
    color: '#EC1B23',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterOptionActive: {
    backgroundColor: '#EC1B23',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#555',
  },
  filterOptionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  categoryOptionActive: {
    backgroundColor: '#EC1B23',
    borderColor: '#EC1B23',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  categoryOptionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 13,
  },
  priceDash: {
    fontSize: 16,
    color: '#999',
  },
  ratingOptions: {
    gap: 8,
  },
  ratingOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  ratingOptionActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  ratingOptionText: {
    fontSize: 13,
    color: '#555',
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 13,
  },
  workModeOptions: {
    gap: 8,
  },
  workModeOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  workModeOptionActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  workModeText: {
    fontSize: 13,
    color: '#555',
  },
  workModeTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  applyButton: {
    paddingVertical: 12,
    backgroundColor: '#EC1B23',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sortOptionActive: {
    backgroundColor: '#FFF8F8',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#555',
  },
  sortOptionTextActive: {
    color: '#EC1B23',
    fontWeight: '600',
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radiusInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 60,
  },
  distanceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

export default SpecialistsCatalogScreen;
