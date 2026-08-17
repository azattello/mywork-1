import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../utils/apiClient';

export default function OrdersHistoryScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const userId = route?.params?.userId;

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request('get', `/api/applications/user/${userId}`);
      if (res.data && res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('load orders error', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (activeFilter === 'all') return orders;
    if (activeFilter === 'active') return orders.filter(o => ['new', 'in_progress', 'agreed'].includes(o.status));
    if (activeFilter === 'completed') return orders.filter(o => o.status === 'completed');
    return orders;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return '#FFC107';
      case 'in_progress':
        return '#2196F3';
      case 'agreed':
        return '#FF9800';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new':
        return 'Новая';
      case 'in_progress':
        return 'В работе';
      case 'agreed':
        return 'Согласована';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  };

  const filteredOrders = getFilteredOrders();

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
        <Text style={s.title}>История заказов</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={s.filterContainer}
        contentContainerStyle={s.filterContent}
      >
        {['all', 'active', 'completed'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[s.filterButton, activeFilter === filter && s.filterButtonActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[s.filterButtonText, activeFilter === filter && s.filterButtonTextActive]}>
              {filter === 'all' ? 'Все' : (filter === 'active' ? 'Активные' : 'Завершённые')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={s.orderCard}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item._id })}
            >
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderTitleLarge} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={s.orderPrice}>
                    {item.summ ? `${item.summ} ₸` : ''}
                  </Text>
                  <View style={s.metaRow}>
                    <Text style={s.metaText} numberOfLines={1}>
                      {item.city && (item.city.name || item.city)}
                    </Text>
                    <Text style={s.metaSeparator}>·</Text>
                    <Text style={s.metaText} numberOfLines={1}>
                      {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    {item.responses && (
                      <>
                        <Text style={s.metaSeparator}>·</Text>
                        <Text style={s.metaText} numberOfLines={1}>
                          {Array.isArray(item.responses) ? item.responses.length : item.responses} {((Array.isArray(item.responses) ? item.responses.length : item.responses) === 1 ? 'отклик' : 'откликов')}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={s.statusBadgeText}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>

              {/* Specialist info if assigned */}
              {item.currentSpecialist && (
                <TouchableOpacity style={s.specialistInfo} activeOpacity={0.8} onPress={() => navigation.navigate('ChatScreen', { otherUserId: item.currentSpecialist._id, otherUserName: item.currentSpecialist.name, applicationId: item._id })}>
                  <Ionicons name="person-circle" size={36} color="#EC1B23" />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={s.specialistName} numberOfLines={1}>
                      {item.currentSpecialist.surname} {item.currentSpecialist.name}
                    </Text>
                    {item.currentSpecialist.city && (
                      <Text style={s.specialistCity} numberOfLines={1}>
                        {item.currentSpecialist.city.name}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chatbubble-outline" size={20} color="#EC1B23" />
                </TouchableOpacity>
              )}

              {/* Review if exists and completed */}
              {item.status === 'completed' && item.review && (
                <View style={s.reviewContainer}>
                  <View style={s.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < item.review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#FFC107"
                      />
                    ))}
                  </View>
                  <Text style={s.reviewText} numberOfLines={2}>
                    {item.review.text}
                  </Text>
                </View>
              )}

              {/* Responses count */}
              {item.responses && (Array.isArray(item.responses) ? item.responses.length > 0 : item.responses > 0) && (
                <View style={s.responsesInfo}>
                  <Ionicons name="chatbox-outline" size={14} color="#666" />
                  <Text style={s.responsesText}>
                    {Array.isArray(item.responses) ? item.responses.length : item.responses} {
                      (Array.isArray(item.responses) ? item.responses.length : item.responses) === 1 ? 'отклик' : 'откликов'
                    }
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* View Responses Button */}
            {item.status !== 'cancelled' && (
              <TouchableOpacity 
                style={s.responsesButton}
                onPress={() => navigation.navigate('ResponsesView', {
                  applicationId: item._id,
                  applicationTitle: item.title
                })}
              >
                <Ionicons name="eye-outline" size={16} color="#EC1B23" />
                <Text style={s.responsesButtonText}>Просмотр откликов</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={s.emptyText}>
              {activeFilter === 'all' 
                ? 'У вас нет заказов'
                : (activeFilter === 'active' 
                  ? 'Активные заказы отсутствуют'
                  : 'Завершённые заказы отсутствуют'
                )
              }
            </Text>
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
  filterContainer: {
    backgroundColor: '#fff',
    // borderBottomWidth: 1,
    borderBottomColor: '#030303',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#EC1B23',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    lineHeight: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: { padding: 16 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  orderTitleLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EC1B23',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#777',
  },
  metaSeparator: {
    marginHorizontal: 6,
    color: '#CCC',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    minHeight: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    includeFontPadding: false,
  },
  specialistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 8,
  },
  specialistName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  specialistCity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  reviewContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  responsesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  responsesText: {
    fontSize: 12,
    color: '#666',
  },
  responsesButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: 'transparent',
  },
  responsesButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EC1B23',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
