import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';
import FavoriteButton from './FavoriteButton';

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const LIMIT = 20;

  useEffect(() => {
    loadFavorites(1);
  }, []);

  const loadFavorites = useCallback(async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);

      const response = await apiClient.get('/api/favorites', {
        params: {
          page: pageNum,
          limit: LIMIT,
        }
      });

      let newFavorites = response?.data?.data || [];
      const pagination = response?.data?.pagination || {};

      if (pageNum === 1) {
        setFavorites(newFavorites);
      } else {
        setFavorites(prev => [...prev, ...newFavorites]);
      }

      setTotal(pagination.total || 0);
      setHasMore(pagination.hasMore || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadFavorites(page + 1);
    }
  };

  const handleViewProfile = (specialistId, name) => {
    navigation.navigate('SpecialistProfileView', {
      specialistId,
      specialistName: name,
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.round(rating) ? 'star' : 'star-outline'}
        size={12}
        color="#FFB800"
      />
    ));
  };

  const renderFavoriteCard = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
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
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#4CAF50"
                style={{ marginLeft: 6 }}
              />
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
              {item.rating?.toFixed(1) || '0'} ({item.reviewsCount || 0})
            </Text>
          </View>
        </View>

        <FavoriteButton
          specialistId={item._id}
          size={20}
          onToggle={() => {
            // Удалить из списка, если удалили из избранного
            setFavorites(prev => prev.filter(fav => fav._id !== item._id));
            setTotal(prev => prev - 1);
          }}
        />
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
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>Нет избранных специалистов</Text>
      <Text style={styles.emptyText}>
        Добавьте специалистов в избранное для быстрого доступа
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('SpecialistsCatalogScreen')}
      >
        <Text style={styles.browseButtonText}>Просмотреть специалистов</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return <ActivityIndicator size="large" color="#EC1B23" style={{ marginVertical: 20 }} />;
  };

  if (loading && page === 1) {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Избранные ({total})</Text>
      </View>

      <FlatList
        data={favorites}
        renderItem={renderFavoriteCard}
        keyExtractor={(item, idx) => `${item._id}_${idx}`}
        contentContainerStyle={favorites.length === 0 ? { flex: 1 } : {}}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialistInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  specialistName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  specialistCity: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  aboutText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#666',
  },
  moreCategoriesText: {
    fontSize: 11,
    color: '#999',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#EC1B23',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default FavoritesScreen;
