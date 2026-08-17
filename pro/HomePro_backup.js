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

  const handleViewFeed = () => {
    navigation.navigate('TabPro', { screen: 'Лента' });
  };

  const handleViewIncoming = () => {
    navigation.navigate('TabPro', { screen: 'Входящие' });
  };

  const handleViewChats = () => {
    navigation.navigate('TabPro', { screen: 'Чаты' });
  };

  const handleCategoryPress = (category) => {
    // Navigate to filtered applications by this category
    Toast.info(`Фильтр по категории: ${category.name}`);
  };

  const handleSearch = () => {
    if (!searchText.trim()) {
      Toast.warning('Введите текст для поиска');
      return;
    }
    // TODO: Implement search functionality
    Toast.info(`Поиск: ${searchText}`);
  };

  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons name="briefcase" size={40} color="#EC1B23" />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greetings}>Добро пожаловать!</Text>
          <Text style={styles.subtitle}>MyWork - твой сервис заказов</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons size={20} color="#999" name="search-outline" />
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск заказов..."
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
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionPrimary]}
            onPress={handleViewFeed}
          >
            <Ionicons size={24} color="#fff" name="flash-outline" />
            <Text style={styles.actionButtonText}>Лента заказов</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={handleViewIncoming}
          >
            <Ionicons size={24} color="#EC1B23" name="inbox-outline" />
            <Text style={styles.actionButtonTextSecond}>Входящие</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionTertiary]}
            onPress={handleViewChats}
          >
            <Ionicons size={24} color="#EC1B23" name="chatbubbles-outline" />
            <Text style={styles.actionButtonTextSecond}>Чаты</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={styles.categoriesTitle}>Категории</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Все</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#EC1B23" style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item._id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.categoryRow}
              contentContainerStyle={styles.categoriesGrid}
            />
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="star" size={32} color="#FFC107" />
            <Text style={styles.infoTitle}>Лучшие предложения</Text>
            <Text style={styles.infoText}>
              Получай заказы, которые соответствуют твоим навыкам и опыту
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
            <Text style={styles.infoTitle}>Защита сделок</Text>
            <Text style={styles.infoText}>
              Безопасное общение и платежи через MyWork
            </Text>
          </View>
        </View>

        {/* Footer */}
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
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
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
    borderWidth: 1,
    borderColor: '#EC1B23',
  },
  actionTertiary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EC1B23',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtonTextSecond: {
    color: '#EC1B23',
    fontSize: 11,
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#EC1B23',
  },
  categoriesGrid: {
    paddingHorizontal: 8,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  categoryCard: {
    width: (width - 56) / 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EC1B23',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
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
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  footerSpace: {
    height: 20,
  },
});
