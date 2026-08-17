import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';

const { width, height } = Dimensions.get('window');

export default function SpecialistResponsesScreen({ navigation }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const currentUserStr = await AsyncStorage.getItem('@currentUser');
      if (!currentUserStr) {
        setResponses([]);
        return;
      }

      const user = JSON.parse(currentUserStr);
      setCurrentUser(user);
      const userId = user?._id || user?.id;

      if (!userId) {
        setResponses([]);
        return;
      }

      // Get all applications and filter by specialist responses
      const res = await apiClient.get('/api/applications?status=open');

      if (res.data && res.data.data) {
        const allApplications = res.data.data;
        const userResponses = [];

        // For each application, get responses and find user's response
        for (const app of allApplications) {
          try {
            const responsesRes = await apiClient.get(`/api/applications/${app._id}/responses`);
            if (responsesRes.data && responsesRes.data.data) {
              const userResponse = responsesRes.data.data.find(
                r => 
                  (r.specialist && r.specialist._id === userId) || 
                  (r.specialist === userId) ||
                  (r.specialistId === userId)
              );

              if (userResponse) {
                userResponses.push({
                  _id: userResponse._id,
                  ...userResponse,
                  application: app,
                  applicationId: app._id,
                  userId: app.user?._id || app.user,
                });
              }
            }
          } catch (err) {
            console.error(`Error loading responses for app ${app._id}:`, err);
          }
        }

        // Also check accepted/in-progress applications
        const userAppsRes = await apiClient.get(`/api/applications/user/${userId}`);
        if (userAppsRes.data && userAppsRes.data.data) {
          const userApps = userAppsRes.data.data;
          for (const app of userApps) {
            if (
              app.status === 'in_progress' &&
              app.assignedSpecialist &&
              (app.assignedSpecialist._id === userId || app.assignedSpecialist === userId)
            ) {
              // Check if already in responses
              const exists = userResponses.find(r => r.applicationId === app._id);
              if (!exists) {
                userResponses.push({
                  _id: `${app._id}-accepted`,
                  application: app,
                  applicationId: app._id,
                  userId: app.user?._id || app.user,
                  status: 'accepted',
                  price: app.proposedPrice,
                  message: app.proposalMessage,
                });
              }
            }
          }
        }

        setResponses(userResponses);
      } else {
        setResponses([]);
      }
    } catch (err) {
      console.error('Error loading responses:', err);
      Toast.error('Не удалось загрузить отклики');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResponses();
    setRefreshing(false);
  };

  const handleDeclineResponse = async (responseId, appId) => {
    Alert.alert(
      'Отклонить заказ?',
      'Вы уверены что хотите отклонить этот заказ?',
      [
        { text: 'Нет', style: 'cancel' },
        {
          text: 'Да, отклонить',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/api/applications/${appId}/responses/${responseId}/decline`);
              
              setResponses(responses.filter(r => r._id !== responseId));
              Toast.success('Отклик отклонен');
            } catch (err) {
              console.error('Error declining response:', err);
              Toast.error(err?.response?.data?.message || 'Ошибка при отклонении отклика');
            }
          },
        },
      ]
    );
  };

  const handleAcceptResponse = async (responseId, appId) => {
    Alert.alert(
      'Принять заказ?',
      'После принятия вы сможете начать работу и общаться в чате.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Принять',
          style: 'default',
          onPress: async () => {
            try {
              await apiClient.post(`/api/applications/${appId}/responses/${responseId}/confirm`);
              
              // Remove from responses and reload
              setResponses(responses.filter(r => r._id !== responseId));
              Toast.success('Заказ принят! Начните работу через чат.');
              
              // Optional: navigate to chat
              // navigation.navigate('ChatListScreen');
            } catch (err) {
              console.error('Error accepting response:', err);
              Toast.error(err?.response?.data?.message || 'Ошибка при принятии заказа');
            }
          },
        },
      ]
    );
  };

  const handleOpenChat = async (item) => {
    try {
      // Get or create conversation
      const conversationsRes = await apiClient.get('/api/conversations');
      if (conversationsRes.data && conversationsRes.data.data) {
        const existingConversation = conversationsRes.data.data.find(
          c =>
            (c.participants && 
             c.participants.some(p => p._id === item.userId || p._id === item.application.user._id)) &&
            (c.applicationId === item.applicationId)
        );

        if (existingConversation) {
          navigation.navigate('ChatScreen', {
            conversationId: existingConversation._id,
            otherUserId: item.userId || item.application.user._id,
            otherUserName: item.application.user.name,
            applicationId: item.applicationId,
          });
        } else {
          // Create new conversation
          const createRes = await apiClient.post('/api/conversations', {
            participantId: item.userId || item.application.user._id,
            applicationId: item.applicationId,
          });

          if (createRes.data && createRes.data.data) {
            navigation.navigate('ChatScreen', {
              conversationId: createRes.data.data._id,
              otherUserId: item.userId || item.application.user._id,
              otherUserName: item.application.user.name,
              applicationId: item.applicationId,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error opening chat:', err);
      Toast.error('Не удалось открыть чат');
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
      .slice(0, 2)
      .join(', ');
  };

  const renderItem = ({ item }) => {
    const app = item.application;
    const isAccepted = item.status === 'accepted';
    const cityName = getCityName(app.city);
    const categoryNames = getCategoryNames(app.categories);

    return (
      <View style={styles.card}>
        {/* Status Badge */}
        {isAccepted && (
          <View style={styles.acceptedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={styles.acceptedBadgeText}>Принято</Text>
          </View>
        )}

        {/* Header: Title and Price */}
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.appTitle} numberOfLines={2}>
              {app.title}
            </Text>
            <Text style={styles.respondStatus}>
              {isAccepted ? 'Заказ принят' : 'Вы откликнулись'}
            </Text>
          </View>
          <Text style={styles.price}>{app.summ} ₸</Text>
        </View>

        {/* Description */}
        {app.info && (
          <Text style={styles.description} numberOfLines={2}>
            {app.info}
          </Text>
        )}

        {/* City and Categories */}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={13} color="#EC1B23" />
          <Text style={styles.infoText}>{cityName}</Text>
        </View>

        {categoryNames && categoryNames !== 'Нет категорий' && (
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={13} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>{categoryNames}</Text>
          </View>
        )}

        {/* Your Offer */}
        {item.price && (
          <View style={styles.yourOfferBox}>
            <Text style={styles.offerLabel}>Ваше предложение:</Text>
            <Text style={styles.offerPrice}>{item.price} ₸</Text>
            {item.estimatedDuration && (
              <Text style={styles.offerDuration}>Срок: {item.estimatedDuration}</Text>
            )}
          </View>
        )}

        {/* Your Message */}
        {item.description && (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Ваше предложение:</Text>
            <Text style={styles.messageText} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}

        {/* Deadline */}
        {app.deadline && (
          <View style={styles.deadlineRow}>
            <Ionicons name="calendar-outline" size={13} color="#999" />
            <Text style={styles.deadlineText}>
              До {new Date(app.deadline).toLocaleDateString('ru-RU')}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setDetailsModal(true) || setSelectedResponse(item)}
          >
            <Ionicons name="eye-outline" size={16} color="#666" />
            <Text style={styles.secondaryButtonText}>Подробнее</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleOpenChat(item)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
            <Text style={styles.chatButtonText}>Чат</Text>
          </TouchableOpacity>
        </View>

        {/* Status-specific Actions */}
        {!isAccepted && (
          <View style={styles.statusButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineResponse(item._id, app._id)}
            >
              <Ionicons name="close-circle" size={16} color="#fff" />
              <Text style={styles.declineButtonText}>Отклонить</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptResponse(item._id, app._id)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.acceptButtonText}>Принять</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="send-outline" size={64} color="#ddd" style={{ marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>Нет отправленных откликов</Text>
      <Text style={styles.emptySubtext}>Отклики на заказы появятся здесь</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={responses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC1B23" />
        }
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        ListEmptyComponent={renderEmpty}
      />

      {/* Details Modal */}
      <Modal
        visible={detailsModal && !!selectedResponse}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Детали заказа</Text>
              <TouchableOpacity
                onPress={() => setDetailsModal(false)}
              >
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Application Details */}
            {selectedResponse && (
              <FlatList
                data={[selectedResponse]}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailsTitle}>{item.application.title}</Text>
                    <Text style={styles.detailsPrice}>{item.application.summ} ₸</Text>

                    <Text style={styles.detailsLabel}>Описание:</Text>
                    <Text style={styles.detailsText}>{item.application.info}</Text>

                    <Text style={styles.detailsLabel}>Город:</Text>
                    <Text style={styles.detailsText}>
                      {getCityName(item.application.city)}
                    </Text>

                    <Text style={styles.detailsLabel}>Категории:</Text>
                    <Text style={styles.detailsText}>
                      {getCategoryNames(item.application.categories)}
                    </Text>

                    {item.application.deadline && (
                      <>
                        <Text style={styles.detailsLabel}>Срок выполнения:</Text>
                        <Text style={styles.detailsText}>
                          {new Date(item.application.deadline).toLocaleDateString('ru-RU')}
                        </Text>
                      </>
                    )}

                    {item.price && (
                      <>
                        <Text style={styles.detailsLabel}>Ваше предложение:</Text>
                        <Text style={styles.detailsText}>{item.price} ₸</Text>
                      </>
                    )}

                    {item.description && (
                      <>
                        <Text style={styles.detailsLabel}>Ваше предложение:</Text>
                        <Text style={styles.detailsText}>{item.description}</Text>
                      </>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    position: 'relative',
  },
  acceptedBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  acceptedBadgeText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginTop: 0,
    paddingRight: 60,
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    lineHeight: 20,
  },
  respondStatus: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  yourOfferBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  offerLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  offerPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EC1B23',
    marginBottom: 2,
  },
  offerDuration: {
    fontSize: 11,
    color: '#666',
  },
  messageBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  deadlineText: {
    fontSize: 12,
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '700',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC1B23',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 4,
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 12,
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
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  detailsPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EC1B23',
    marginBottom: 16,
  },
  detailsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
