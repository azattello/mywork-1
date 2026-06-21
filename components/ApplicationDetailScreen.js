import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';

const ApplicationDetailScreen = ({ route, navigation }) => {
  const { applicationId } = route.params;
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [specialist, setSpecialist] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [responses, setResponses] = useState([]);
  
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    text: '',
  });
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  useEffect(() => {
    loadApplicationDetail();
    loadResponses();
  }, [applicationId]);

  const loadResponses = async () => {
    try {
      const res = await apiClient.get(`/api/applications/${applicationId}/responses`);
      const list = res?.data?.data || res?.data || [];
      setResponses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error loading responses', err);
    }
  };

  const loadApplicationDetail = async () => {
    try {
      setLoading(true);
      
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }

      const response = await apiClient.get(`/api/applications/${applicationId}`);
      const app = response?.data?.data || response?.data || null;
      if (app) {
        const normalizedApp = {
          ...app,
          categories: (app.categories || []).map((c) => {
            if (!c) return null;
            if (typeof c === 'string') return c;
            if (typeof c === 'object') return c.name || c.title || String(c._id || c.id || JSON.stringify(c));
            return String(c);
          }).filter(Boolean),
        };
        setApplication(normalizedApp);

        if (app.currentSpecialist) {
          try {
            const specResponse = await apiClient.get(`/api/users/${app.currentSpecialist}`);
            const spec = specResponse?.data?.data || specResponse?.data || null;
            if (spec) setSpecialist(spec);
          } catch (err) {
            console.log('Specialist not found');
          }
        }
      }
    } catch (error) {
      console.error('Error loading application:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заказ');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (userId, userName) => {
    if (!userId) {
      Alert.alert('Ошибка', 'Невозможно открыть профиль');
      return;
    }
    navigation.navigate('SpecialistProfile', { userId, userName });
  };

  const handleAcceptResponse = async (responseId) => {
    try {
      setUpdating(true);
      const res = await apiClient.post(`/api/applications/${applicationId}/responses/${responseId}/accept`);
      if (res?.status === 200) {
        Alert.alert('Успех', 'Ответ принят');
        loadApplicationDetail();
        loadResponses();
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось принять ответ');
      console.error('Error accepting response:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectResponse = async (responseId) => {
    try {
      setUpdating(true);
      const res = await apiClient.post(`/api/applications/${applicationId}/responses/${responseId}/reject`);
      if (res?.status === 200) {
        Alert.alert('Успех', 'Ответ отклонен');
        loadResponses();
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отклонить ответ');
      console.error('Error rejecting response:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePublish = async () => {
    try {
      setUpdating(true);
      const res = await apiClient.post(`/api/applications/${applicationId}/publish`);
      if (res?.status === 200) {
        Alert.alert('Успех', 'Заказ опубликован');
        loadApplicationDetail();
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось опубликовать заказ');
      console.error('Error publishing:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleMenuAction = (action) => {
    setMenuModalVisible(false);
    if (action === 'edit') {
      navigation.navigate('CreateApplicationScreen', { applicationId });
    } else if (action === 'delete') {
      Alert.alert('Удалить заказ?', 'Это действие нельзя отменить', [
        { text: 'Отмена' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              await apiClient.delete(`/api/applications/${applicationId}`);
              Alert.alert('Успех', 'Заказ удален');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить заказ');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]);
    }
  };

  const handleReviewSubmit = async () => {
    try {
      setUpdating(true);
      const res = await apiClient.post(`/api/applications/${applicationId}/review`, reviewData);
      if (res?.status === 200 || res?.status === 201) {
        Alert.alert('Успех', 'Отзыв добавлен');
        setReviewModalVisible(false);
        loadApplicationDetail();
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить отзыв');
      console.error('Error adding review:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#EC1B23" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 16 }}>Заказ не найден</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuModalVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Main Title & Price */}
        <View style={styles.titleSection}>
          <Text style={styles.titleLarge}>{application.title}</Text>
          {application.budgetMin != null && application.budgetMax != null ? (
            <Text style={styles.priceLarge}>
              {application.budgetMin} - {application.budgetMax} ₸
            </Text>
          ) : application.summ != null ? (
            <Text style={styles.priceLarge}>{application.summ} ₸</Text>
          ) : null}
        </View>

        {/* Meta Info (City, Date, Count) */}
        {(application.city || application.createdAt || responses.length > 0) && (
          <View style={styles.metaRow}>
            {application.city && (
              <Text style={styles.metaText}>
                📍 {typeof application.city === 'string' ? application.city : application.city?.name}
              </Text>
            )}
            {application.createdAt && (
              <Text style={styles.metaText}>
                {new Date(application.createdAt).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
              </Text>
            )}
            {responses.length > 0 && (
              <Text style={styles.metaText}>
                💬 {responses.length} {responses.length === 1 ? 'отклик' : 'откликов'}
              </Text>
            )}
          </View>
        )}

        {/* Status Badge */}
        {application.status && (
          <View style={[styles.statusBadge, { backgroundColor: application.status === 'open' ? '#E3F2FD' : application.status === 'in_progress' ? '#FFF3E0' : '#F3E5F5' }]}>
            <Text style={[styles.statusBadgeText, { color: application.status === 'open' ? '#1976D2' : application.status === 'in_progress' ? '#F57C00' : '#7B1FA2' }]}>
              {application.status === 'open' ? 'Открыт' : application.status === 'in_progress' ? 'В процессе' : 'Завершен'}
            </Text>
          </View>
        )}

        {/* Publish Button */}
        {application.status === 'draft' && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.publishButton}
              onPress={handlePublish}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="share-social" size={14} color="#fff" />
                  <Text style={styles.actionButtonText}>Опубликовать как заказ</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Application Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о заказе</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Название:</Text>
            <Text style={styles.infoValue}>{application.title}</Text>
          </View>
          {application.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Описание:</Text>
              <Text style={styles.infoValue}>{application.description}</Text>
            </View>
          )}
          {application.budgetMin != null && application.budgetMax != null ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Бюджет:</Text>
              <Text style={styles.infoValue}>
                {application.budgetMin} - {application.budgetMax} ₸ ({application.budgetType})
              </Text>
            </View>
          ) : application.summ != null ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Бюджет:</Text>
              <Text style={styles.infoValue}>{application.summ} ₸</Text>
            </View>
          ) : null}
          {application.workMode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Формат работы:</Text>
              <Text style={styles.infoValue}>
                {application.workMode === 'online' ? 'Онлайн' : application.workMode === 'offline' ? 'Оффлайн' : 'Онлайн и оффлайн'}
              </Text>
            </View>
          )}
          {application.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Адрес:</Text>
              <Text style={styles.infoValue}>{application.address}</Text>
            </View>
          )}
          {application.city && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Город:</Text>
              <Text style={styles.infoValue}>{typeof application.city === 'string' ? application.city : application.city?.name}</Text>
            </View>
          )}
          {application.categories && application.categories.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Категории:</Text>
              <View style={styles.categoriesContainer}>
                {application.categories.map((cat) => (
                  <View key={cat} style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {application.deadline && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Срок выполнения:</Text>
              <Text style={styles.infoValue}>
                {new Date(application.deadline).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Создано:</Text>
            <Text style={styles.infoValue}>
              {new Date(application.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Specialist Info */}
        {specialist && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Специалист</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ChatScreen', { otherUserId: specialist._id, otherUserName: specialist.name, applicationId: applicationId })}
            >
              <View style={styles.specialistRow}>
                <View>
                  <Text style={styles.specialistName}>
                    {specialist.surname} {specialist.name}
                  </Text>
                  {specialist.city && (
                    <Text style={styles.specialistDetail}>
                      <Ionicons name="location" size={12} color="#999" /> {typeof specialist.city === 'string' ? specialist.city : specialist.city?.name}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Ionicons name="chatbubble-outline" size={22} color="#EC1B23" />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.specialistRating}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={
                    i < Math.round(specialist.rating || 0) ? 'star' : 'star-outline'
                  }
                  size={14}
                  color="#FFD700"
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={styles.ratingText}>
                {specialist.rating ? specialist.rating.toFixed(1) : '0'} (
                {specialist.reviewCount || 0})
              </Text>
            </View>
          </View>
        )}

        {/* Responses list */}
        {responses && responses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Отклики</Text>
            {responses.map((r) => (
              <View key={r._id} style={styles.responseCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.responseName} numberOfLines={1}>
                    {r.specialist?.surname} {r.specialist?.name}
                  </Text>
                  {r.price != null && (
                    <Text style={styles.responsePrice}>{r.price} ₸</Text>
                  )}
                  {r.deadline && (
                    <Text style={styles.responseDeadline}>
                      Срок: {new Date(r.deadline).toLocaleDateString('ru-RU')}
                    </Text>
                  )}
                  <Text style={styles.responseMessage} numberOfLines={2}>{r.message}</Text>
                  {r.status && (
                    <Text style={styles.responseStatus}>
                      Статус: {r.status === 'pending' ? 'Ожидание' : r.status === 'accepted' ? 'Принят' : 'Отклонен'}
                    </Text>
                  )}
                </View>
                <View style={styles.responseActions}>
                  {r.status === 'pending' && (
                    <>
                      <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptResponse(r._id)}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                        <Text style={styles.acceptButtonText}>Принять</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectResponse(r._id)}>
                        <Ionicons name="close" size={14} color="#fff" />
                        <Text style={styles.rejectButtonText}>Отклонить</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <TouchableOpacity 
                      style={styles.chatButton} 
                      onPress={() => navigation.navigate('ChatScreen', { otherUserId: r.specialist?._id, otherUserName: r.specialist?.name, applicationId: applicationId })}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                      <Text style={styles.chatButtonText}>Чат</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Review */}
        {application.status === 'closed' && !application.review && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.reviewButton} onPress={() => setReviewModalVisible(true)}>
              <Ionicons name="star-outline" size={18} color="#fff" />
              <Text style={styles.reviewButtonText}>Оставить отзыв</Text>
            </TouchableOpacity>
          </View>
        )}

        {application.review && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ваш отзыв</Text>
            <View style={styles.reviewBox}>
              <View style={styles.reviewRating}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < application.review.rating ? 'star' : 'star-outline'}
                    size={14}
                    color="#FFD700"
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text style={styles.reviewText}>{application.review.text}</Text>
              <Text style={styles.reviewDate}>
                {new Date(application.review.createdAt).toLocaleDateString('ru-RU')}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={menuModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <View style={styles.menuModalOverlay}>
          <View style={styles.menuModalContent}>
            <TouchableOpacity style={styles.menuButton} onPress={() => handleMenuAction('edit')}>
              <Text style={styles.menuButtonText}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuButton, { backgroundColor: '#FDECEA' }]} onPress={() => handleMenuAction('delete')}>
              <Text style={[styles.menuButtonText, { color: '#C62828' }]}>Удалить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuButton, styles.menuCancel]} onPress={() => setMenuModalVisible(false)}>
              <Text style={styles.menuButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оставить отзыв</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.reviewQuestion}>Оценка:</Text>
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewData({ ...reviewData, rating: star })}
                    style={{ marginRight: 8 }}
                  >
                    <Ionicons
                      name={star <= reviewData.rating ? 'star' : 'star-outline'}
                      size={28}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.reviewQuestion}>Ваш отзыв:</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Напишите ваш отзыв..."
                placeholderTextColor="#999"
                value={reviewData.text}
                onChangeText={(text) => setReviewData({ ...reviewData, text })}
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setReviewModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleReviewSubmit}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Отправить</Text>
                )}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  priceLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EC1B23',
  },
  metaRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#EC1B23',
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#000',
    flex: 1.5,
    textAlign: 'right',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#000',
  },
  specialistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 8,
  },
  specialistName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  specialistDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  specialistRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  responseCard: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  responseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  responsePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EC1B23',
    marginTop: 4,
  },
  responseDeadline: {
    fontSize: 12,
    color: '#7B1FA2',
    marginTop: 2,
  },
  responseMessage: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  responseStatus: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  responseActions: {
    marginLeft: 12,
    gap: 6,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    gap: 4,
  },
  acceptButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#C62828',
    borderRadius: 6,
    gap: 4,
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#EC1B23',
    borderRadius: 6,
    gap: 6,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFC107',
    borderRadius: 8,
    gap: 8,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 13,
    color: '#000',
    marginBottom: 6,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
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
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reviewQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  starPicker: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#F8F8F8',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#EC1B23',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  menuModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuModalContent: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuButton: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuButtonText: {
    fontSize: 16,
    color: '#000',
  },
  menuCancel: {
    marginTop: 8,
    backgroundColor: '#fff',
  },
});

export default ApplicationDetailScreen;







