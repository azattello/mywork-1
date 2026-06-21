import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../utils/apiClient';

export default function ReviewsScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const userId = route?.params?.userId;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request('get', `/api/users/stats/${userId}`);
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('load stats error', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color="#EC1B23" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.wrapper}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={s.title}>Отзывы</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={[{ type: 'stats' }, ...((stats?.reviews || []).map((r, i) => ({ ...r, type: 'review', id: i })) || [])]}
        keyExtractor={(item, i) => item.type === 'stats' ? 'stats' : item.id}
        renderItem={({ item }) => {
          if (item.type === 'stats') {
            return (
              <View style={s.statsContainer}>
                <View style={s.ratingCard}>
                  <Text style={s.ratingLabel}>Средняя оценка</Text>
                  <View style={s.ratingValue}>
                    <Text style={s.ratingNumber}>{stats?.averageRating || 0}</Text>
                    <Ionicons name="star" size={24} color="#FFC107" />
                  </View>
                  <Text style={s.statsText}>{stats?.totalReviews || 0} отзывов</Text>
                  <Text style={s.statsText}>{stats?.completedApplications || 0} завершено заказов</Text>
                </View>
              </View>
            );
          }

          return (
            <View style={s.reviewItem}>
              <View style={s.reviewHeader}>
                <View style={s.ratingBadge}>
                  <Ionicons name="star" size={16} color="#fff" />
                  <Text style={s.ratingBadgeText}>{item.rating}</Text>
                </View>
              </View>
              <Text style={s.reviewText}>{item.text || 'Текст отзыва не указан'}</Text>
              <Text style={s.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="star-outline" size={48} color="#ccc" />
            <Text style={s.emptyText}>Отзывы пока не оставляли</Text>
          </View>
        }
        scrollEnabled={true}
        contentContainerStyle={s.listContent}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F2F2F2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '700' },
  listContent: { padding: 16 },
  statsContainer: { marginBottom: 16 },
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  ratingLabel: { fontSize: 14, color: '#999', marginBottom: 8 },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingNumber: { fontSize: 36, fontWeight: '700', color: '#333' },
  statsText: { fontSize: 13, color: '#666', marginTop: 4 },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: { marginBottom: 10 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ratingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  reviewText: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 8 },
  reviewDate: { fontSize: 12, color: '#999' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
