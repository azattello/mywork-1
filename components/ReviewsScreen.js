import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';
import { API_URL } from '../config';

const ReviewsScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const LIMIT = 10;

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);

      // Загружаем отзывы и статистику параллельно
      const [reviewsRes, statsRes] = await Promise.all([
        apiClient.get(`/api/users/${userId}/reviews`, {
          params: { page: pageNum, limit: LIMIT }
        }),
        apiClient.get(`/api/users/${userId}/rating-stats`)
      ]);

      const newReviews = reviewsRes?.data?.data || [];
      const newStats = statsRes?.data?.data || null;

      if (pageNum === 1) {
        setReviews(newReviews);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }

      setStats(newStats);
      setPage(pageNum);
      setHasMore((reviewsRes?.data?.pagination?.totalPages || 0) > pageNum);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i < roundedRating ? 'star' : 'star-outline'}
          size={16}
          color="#FFD700"
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const renderRatingStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        {/* Средняя оценка */}
        <View style={styles.averageRatingCard}>
          <Text style={styles.avgRatingValue}>
            {stats.averageRating || '0'}
          </Text>
          <View style={styles.starsRow}>
            {renderStars(stats.averageRating)}
          </View>
          <Text style={styles.totalReviewsText}>
            {stats.totalReviews} отзывов
          </Text>
        </View>

        {/* Критерии оценки */}
        {stats.totalReviews > 0 && (
          <View style={styles.criteriaContainer}>
            <Text style={styles.sectionTitle}>Оценка по критериям</Text>
            
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>Качество работы</Text>
              <View style={styles.criteriaStars}>
                {renderStars(stats.qualityAvg)}
              </View>
              <Text style={styles.criteriaValue}>{stats.qualityAvg}</Text>
            </View>

            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>Соблюдение сроков</Text>
              <View style={styles.criteriaStars}>
                {renderStars(stats.timingAvg)}
              </View>
              <Text style={styles.criteriaValue}>{stats.timingAvg}</Text>
            </View>

            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>Коммуникация</Text>
              <View style={styles.criteriaStars}>
                {renderStars(stats.communicationAvg)}
              </View>
              <Text style={styles.criteriaValue}>{stats.communicationAvg}</Text>
            </View>
          </View>
        )}

        {/* Распределение оценок */}
        {stats.ratingDistribution && stats.totalReviews > 0 && (
          <View style={styles.distributionContainer}>
            <Text style={styles.sectionTitle}>Распределение оценок</Text>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 
                ? Math.round((count / stats.totalReviews) * 100)
                : 0;

              return (
                <View key={rating} style={styles.distributionRow}>
                  <Text style={styles.ratingLabel}>{rating}★</Text>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        { width: `${percentage}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderReviewCard = ({ item }) => {
    const reviewImage = item?.image ? item.image : null;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          {getAvatarUri(item.author) ? (
            <Image source={{ uri: getAvatarUri(item.author) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#999" />
            </View>
          )}

          <View style={styles.reviewMeta}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {item.author?.surname} {item.author?.name}
              </Text>
              {item.author?.role === 'specialist' && (
                <View style={styles.specialistBadge}>
                  <Text style={styles.specialistBadgeText}>🔧 Спец.</Text>
                </View>
              )}
            </View>
            
            <View style={styles.reviewStars}>
              {renderStars(item.rating)}
            </View>
            
            <Text style={styles.reviewDate}>
              {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {(item.qualityRating || item.timingRating || item.communicationRating) && (
          <View style={styles.reviewCriteria}>
            {item.qualityRating && (
              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaItemLabel}>Качество</Text>
                <View style={styles.miniStars}>
                  {renderStars(item.qualityRating)}
                </View>
              </View>
            )}
            {item.timingRating && (
              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaItemLabel}>Сроки</Text>
                <View style={styles.miniStars}>
                  {renderStars(item.timingRating)}
                </View>
              </View>
            )}
            {item.communicationRating && (
              <View style={styles.criteriaItem}>
                <Text style={styles.criteriaItemLabel}>Общение</Text>
                <View style={styles.miniStars}>
                  {renderStars(item.communicationRating)}
                </View>
              </View>
            )}
          </View>
        )}

        {item.text && (
          <Text style={styles.reviewText} numberOfLines={4}>
            {item.text}
          </Text>
        )}

        {reviewImage && (
          <Image source={{ uri: reviewImage.startsWith('/uploads/') ? `${API_URL}${reviewImage}` : reviewImage }} style={styles.reviewImage} resizeMode="cover" />
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={64} color="#DDD" />
      <Text style={styles.emptyTitle}>Нет отзывов</Text>
      <Text style={styles.emptyText}>
        Отзывы от клиентов появятся здесь после завершения работ
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return <ActivityIndicator size="large" color="#EC1B23" style={{ marginVertical: 20 }} />;
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Отзывы</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Отзывы</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReviewCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderRatingStats}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={reviews.length === 0 ? { flex: 1 } : {}}
      />
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
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statsContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  averageRatingCard: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  avgRatingValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#EC1B23',
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  totalReviewsText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 10,
  },
  criteriaContainer: {
    paddingTop: 12,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  criteriaLabel: {
    fontSize: 12,
    color: '#555',
    flex: 1,
  },
  criteriaStars: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  criteriaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EC1B23',
    width: 25,
    textAlign: 'right',
  },
  distributionContainer: {
    paddingTop: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#555',
    width: 35,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#EEE',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  countText: {
    fontSize: 12,
    color: '#999',
    width: 25,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewMeta: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  specialistBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  specialistBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
  },
  reviewStars: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  reviewCriteria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    marginBottom: 10,
  },
  criteriaItem: {
    alignItems: 'center',
    flex: 1,
  },
  criteriaItemLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  miniStars: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ReviewsScreen;
