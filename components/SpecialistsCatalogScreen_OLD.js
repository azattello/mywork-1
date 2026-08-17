import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';

const SpecialistsCatalogScreen = ({ navigation }) => {
  const [specialists, setSpecialists] = useState([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [searchText, setSearchText] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load specialists
      const response = await apiClient.get('/api/users', {
        params: {
          role: 'specialist',
        },
      });

      let users = response?.data?.data || response?.data || [];
      if (Array.isArray(users)) {
        // Normalize city and filter only those with categories (specialists)
        users = users
          .map(u => ({
            ...u,
            city: u.city && (u.city.name || u.city),
            // normalize categories to strings when backend returns objects
            categories: (u.categories || []).map(cat => {
              if (!cat) return null;
              if (typeof cat === 'string') return cat;
              if (typeof cat === 'object') return cat.name || cat.title || String(cat._id || cat.id || JSON.stringify(cat));
              return String(cat);
            }).filter(Boolean),
          }))
          .filter(u => u.categories && u.categories.length > 0); // Only specialists

        setSpecialists(users);
        setFilteredSpecialists(users);

        // Extract unique cities
        const uniqueCities = [...new Set(users.map(s => s.city).filter(Boolean))];
        setCities(uniqueCities.sort());

        // Extract unique categories
        const allCategories = users.flatMap(s => s.categories || []);
        const uniqueCategories = [...new Set(allCategories)];
        setCategories(uniqueCategories.sort());
      }
    } catch (error) {
      console.error('Error loading specialists:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить специалистов');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = specialists;

    // Search by name, surname, or categories
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.surname && s.surname.toLowerCase().includes(query)) ||
          (s.categories && s.categories.some(cat => cat.toLowerCase().includes(query)))
      );
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter((s) => s.city === selectedCity);
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (s) =>
          s.categories &&
          selectedCategories.some((cat) => s.categories.includes(cat))
      );
    }

    setFilteredSpecialists(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchText, selectedCity, selectedCategories]);

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedCity(null);
    setSelectedCategories([]);
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
      onPress={() =>
        handleViewProfile(item._id, item.name)
      }
    >
      {/* Header with avatar and info */}
      <View style={styles.cardHeader}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={32} color="#999" />
          </View>
        )}

        <View style={styles.specialistInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.specialistName}>
              {item.surname} {item.name}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginLeft: 6 }} />
            )}
          </View>
          {item.city && (
            <Text style={styles.specialistCity}>
              <Ionicons name="location" size={12} color="#999" /> {item.city}
            </Text>
          )}
          <View style={styles.ratingRow}>
            {renderStars(item.rating)}
            <Text style={styles.ratingText}>
              {item.rating ? item.rating.toFixed(1) : '0'} ({item.reviewCount || 0})
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>

      {/* About */}
      {item.about && (
        <Text style={styles.aboutText} numberOfLines={2}>
          {item.about}
        </Text>
      )}

      {/* Categories */}
      {item.categories && item.categories.length > 0 && (
        <View style={styles.categoriesRow}>
          {item.categories.slice(0, 3).map((cat) => (
            <View key={cat} style={styles.categoryTag}>
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
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>Специалистов не найдено</Text>
      <Text style={styles.emptyText}>
        Попробуйте изменить параметры поиска или фильтры
      </Text>
    </View>
  );

  if (loading) {
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

  const activeFiltersCount = (selectedCity ? 1 : 0) + selectedCategories.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Специалисты</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <View>
            <Ionicons name="funnel" size={24} color="#000" />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по имени, фамилии, категории..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Active Filters */}
      {(selectedCity || selectedCategories.length > 0) && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCity && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => setSelectedCity(null)}
              >
                <Text style={styles.filterChipText}>{selectedCity}</Text>
                <Ionicons
                  name="close"
                  size={14}
                  color="#fff"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            )}
            {selectedCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.filterChip}
                onPress={() => toggleCategory(cat)}
              >
                <Text style={styles.filterChipText}>{cat}</Text>
                <Ionicons
                  name="close"
                  size={14}
                  color="#fff"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Specialists List */}
      <FlatList
        data={filteredSpecialists}
        renderItem={renderSpecialistCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Фильтры</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Очистить</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* City Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Город</Text>
                <View style={styles.filterOptions}>
                  {cities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.filterOption,
                        selectedCity === city && styles.filterOptionSelected,
                      ]}
                      onPress={() =>
                        setSelectedCity(selectedCity === city ? null : city)
                      }
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedCity === city && styles.checkboxSelected,
                        ]}
                      >
                        {selectedCity === city && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.filterOptionText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Categories Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Категории</Text>
                <View style={styles.categoriesGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        selectedCategories.includes(cat) &&
                          styles.categoryOptionSelected,
                      ]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          selectedCategories.includes(cat) &&
                            styles.categoryOptionTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Применить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EC1B23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
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
  activeFilters: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#EC1B23',
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  specialistCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialistInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  specialistName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  specialistCity: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  aboutText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#666',
  },
  moreCategoriesText: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'center',
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
  clearFiltersText: {
    fontSize: 12,
    color: '#EC1B23',
    fontWeight: '500',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  filterOptionSelected: {
    backgroundColor: '#F0F0F0',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#EC1B23',
    borderColor: '#EC1B23',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flex: 1,
    minWidth: '48%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  categoryOptionSelected: {
    backgroundColor: '#EC1B23',
    borderColor: '#EC1B23',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#EC1B23',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

export default SpecialistsCatalogScreen;
