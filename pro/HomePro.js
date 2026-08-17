import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';

const { width } = Dimensions.get('window');

export default function HomePro({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/categories');
      const list = res?.data?.data || [];
      setCategories(list);
    } catch (error) {
      console.error('Error loading categories:', error);
      Toast.error('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  const handleViewIncoming = () => {
    navigation.navigate('TabPro', { screen: 'Входящие' });
  };

  const handleViewChats = () => {
    navigation.navigate('TabPro', { screen: 'Чаты' });
  };

  const handleViewFeed = () => {
    navigation.navigate('TabPro', { screen: 'Лента' });
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('AvailableApplicationsScreen', {
      categoryId: category._id,
      categoryName: category.name,
    });
  };

  const handleViewAllCategories = () => {
    navigation.navigate('CategoriesList');
  };

  const handleSearch = () => {
    if (!searchText.trim()) {
      Toast.warning('Введите текст для поиска');
      return;
    }
    // TODO: Implement search by title/description
    navigation.navigate('AvailableApplicationsScreen', { 
      searchQuery: searchText
    });
  };

  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons name="briefcase-outline" size={36} color="#EC1B23" />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name || 'Категория'}
      </Text>
    </TouchableOpacity>
  );

  const displayedCategories = categories.slice(0, 6); // Show first 6

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greetings}>MyWork</Text>
          <Text style={styles.subtitle}>Найди свой следующий заказ</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons size={20} color="#999" name="search-outline" />
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск заказов по названию..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons size={20} color="#999" name="close-circle" />
              </TouchableOpacity>
            )}
          </View>
          {searchText.length > 0 && (
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchButtonText}>Поиск</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions - только Входящие и Чаты (убрали Лента и "Доступные заказы") */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionPrimary]}
            onPress={handleViewIncoming}
          >
            <Ionicons size={24} color="#fff" name="inbox-outline" />
            <Text style={styles.actionButtonText}>Входящие</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={handleViewChats}
          >
            <Ionicons size={24} color="#EC1B23" name="chatbubbles-outline" />
            <Text style={styles.actionButtonTextSecond}>Чаты</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionTertiary]}
            onPress={handleViewFeed}
          >
            <Ionicons size={24} color="#EC1B23" name="flash-outline" />
            <Text style={styles.actionButtonTextSecond}>Лента</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={styles.categoriesTitle}>Категории</Text>
            {categories.length > 6 && (
              <TouchableOpacity onPress={handleViewAllCategories}>
                <Text style={styles.viewAllText}>Все →</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#EC1B23" style={{ marginVertical: 20 }} />
          ) : categories.length > 0 ? (
            <FlatList
              data={displayedCategories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item._id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.categoryRow}
              contentContainerStyle={styles.categoriesGrid}
            />
          ) : (
            <Text style={styles.noCategoriesText}>Категории не найдены</Text>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="star" size={28} color="#FFC107" />
            </View>
            <Text style={styles.infoTitle}>Новые заказы</Text>
            <Text style={styles.infoText}>
              Получай самые свежие заказы, соответствующие твоим навыкам
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="shield-checkmark" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.infoTitle}>Безопасность</Text>
            <Text style={styles.infoText}>
              Защищённые платежи и проверенные заказчики в MyWork
            </Text>
          </View>
        </View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  greetings: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EC1B23',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: '#000',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC1B23',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    backgroundColor: '#EC1B23',
  },
  actionSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EC1B23',
  },
  actionTertiary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EC1B23',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtonTextSecond: {
    color: '#EC1B23',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  categoriesSection: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingVertical: 16,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EC1B23',
  },
  categoriesGrid: {
    paddingHorizontal: 8,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryCard: {
    width: (width - 56) / 3,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#EC1B23',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  noCategoriesText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  infoIconBox: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerSpace: {
    height: 60,
  },
});
