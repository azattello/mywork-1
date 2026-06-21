import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import ReviewModal from './ReviewModal';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, otherUserId, otherUserName, applicationId } = route.params;
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [application, setApplication] = useState(null);
  const [otherUser, setOtherUser] = useState(null); // Информация о другом пользователе (lastSeen, статус онлайна)
  const [accessDenied, setAccessDenied] = useState(false); // Доступ запрещён (специалист ещё не разблокирован)
  const [response, setResponse] = useState(null); // Данные об отклике специалиста
  const [responseLoading, setResponseLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const userStr = await AsyncStorage.getItem('@currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);

          // Load other user info (including lastSeen)
          try {
            const otherUserResponse = await apiClient.get(`/api/auth/user/${otherUserId}`);
            const otherUserData = otherUserResponse?.data?.data || otherUserResponse?.data || null;
            if (otherUserData) {
              setOtherUser(otherUserData);
            }
          } catch (err) {
            console.log('Could not load other user info');
          }

          let convId = conversationId;
          if (!convId) {
            const response = await apiClient.post('/api/conversations', {
              participants: [user._id, otherUserId],
              applicationId: applicationId,
            });
            const conv = response?.data?.data || response?.data || null;
            convId = conv?._id || conv?.id || convId;
            setCurrentConversationId(convId);
          }

          await loadMessages(convId);

          // Load response data if application exists
          if (applicationId) {
            await loadResponseData(applicationId, user._id);
          }

          // Initialize socket connection once we have conversation id
          try {
            if (!socketRef.current) {
              socketRef.current = io(API_URL, { transports: ['websocket'] });
            }
            if (socketRef.current && convId) {
              socketRef.current.emit('join', convId);
              socketRef.current.off('message');
              socketRef.current.off('unlock_chat');
              socketRef.current.off('proposal_selected');
              socketRef.current.off('proposal_confirmed');
              socketRef.current.off('proposal_declined');
              socketRef.current.off('work_marked_complete');
              socketRef.current.off('work_accepted');
              
              socketRef.current.on('message', (payload) => {
                // payload may be message object or { conversation, message }
                const incoming = payload?.message || payload;
                if (!incoming) return;
                // Only add if belongs to this conversation
                const convIdStr = convId.toString();
                if (payload?.conversation && payload.conversation.toString() !== convIdStr) return;

                setMessages(prev => {
                  // avoid duplicates
                  if (prev.find(m => m._id === incoming._id)) return prev;
                  return [...prev, incoming].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                });

                // mark incoming messages as read if from other user
                if (!incoming.isRead && incoming.from !== user?._id) {
                  apiClient.patch(`/api/messages/${incoming._id}/read`).catch(() => {});
                }
              });

              // Listen for unlock event (when client sends first message)
              socketRef.current.on('unlock_chat', (payload) => {
                console.log('Chat unlocked:', payload);
                setAccessDenied(false);
                // Reload messages after unlock
                loadMessages(convId);
              });

              // Proposal events
              socketRef.current.on('proposal_selected', () => {
                console.log('Proposal selected by client');
                if (applicationId) loadResponseData(applicationId, user._id);
              });

              socketRef.current.on('proposal_confirmed', () => {
                console.log('Proposal confirmed by specialist');
                if (applicationId) loadResponseData(applicationId, user._id);
              });

              socketRef.current.on('proposal_declined', () => {
                console.log('Proposal declined by specialist');
                if (applicationId) loadResponseData(applicationId, user._id);
              });

              socketRef.current.on('work_marked_complete', () => {
                console.log('Work marked complete');
                if (applicationId) loadApplicationData(applicationId);
              });

              socketRef.current.on('work_accepted', () => {
                console.log('Work accepted');
                if (applicationId) loadApplicationData(applicationId);
              });
            }
          } catch (err) {
            console.log('Socket init error', err);
          }
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить чат');
      } finally {
        setLoading(false);
      }
    };

    // Load application if applicationId provided
    const loadApplication = async () => {
      if (applicationId) {
        await loadApplicationData(applicationId);
      }
    };

    loadChat();
    loadApplication();

    // Refresh other user's info every 5 seconds to update online status
    const otherUserInterval = setInterval(() => {
      if (otherUserId) {
        apiClient.get(`/api/auth/user/${otherUserId}`)
          .then(res => {
            const otherUserData = res?.data?.data || res?.data || null;
            if (otherUserData) {
              setOtherUser(otherUserData);
            }
          })
          .catch(() => {});
      }
    }, 5000);

    return () => {
      // leave room and disconnect socket if present
      try {
        if (socketRef.current && currentConversationId) {
          socketRef.current.emit('leave', currentConversationId);
        }
        // cleanup listeners
        if (socketRef.current) {
          socketRef.current.off('message');
          socketRef.current.off('unlock_chat');
          socketRef.current.off('proposal_selected');
          socketRef.current.off('proposal_confirmed');
          socketRef.current.off('proposal_declined');
          socketRef.current.off('work_marked_complete');
          socketRef.current.off('work_accepted');
        }
      } catch (e) {}
      clearInterval(otherUserInterval);
    };
  }, [conversationId, otherUserId]);

  const loadApplicationData = async (appId) => {
    try {
      const res = await apiClient.get(`/api/applications/${appId}`);
      const app = res?.data?.data || res?.data || null;
      if (app) setApplication(app);
    } catch (err) {
      console.log('Application not found or already deleted');
    }
  };

  const loadResponseData = async (appId, userId) => {
    try {
      setResponseLoading(true);
      const res = await apiClient.get(`/api/applications/${appId}/responses/${otherUserId}`);
      const resp = res?.data?.data || res?.data || null;
      if (resp) setResponse(resp);
    } catch (err) {
      console.log('Response not found');
      setResponse(null);
    } finally {
      setResponseLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      setAccessDenied(false);
      const response = await apiClient.get(`/api/messages/${convId}`);
      const list = response?.data?.data || response?.data || [];
      if (Array.isArray(list)) {
        setMessages(list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        
        // Mark unread messages from other user as read
        list.forEach(msg => {
          if (!msg.isRead && msg.from !== currentUser?._id) {
            apiClient.patch(`/api/messages/${msg._id}/read`).catch(() => {});
          }
        });
      }
    } catch (error) {
      // Check if access denied (specialist not unlocked yet)
      if (error?.response?.status === 403) {
        setAccessDenied(true);
        console.log('Access denied - specialist waiting for client first message');
      } else {
        console.error('Error loading messages:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить сообщения');
      }
    }
  };

  // Формат статуса "был в сети"
  const getOnlineStatus = () => {
    if (!otherUser?.lastSeen) return 'Статус неизвестен';
    
    const lastSeenDate = new Date(otherUser.lastSeen);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) {
      return '🟢 В сети сейчас';
    } else if (diffMinutes < 60) {
      return `Был(а) в сети ${diffMinutes} мин назад`;
    } else if (diffHours < 24) {
      return `Был(а) в сети ${diffHours} ч назад`;
    } else if (diffDays < 7) {
      return `Был(а) в сети ${diffDays} дн назад`;
    } else {
      return `Был(а) в сети ${lastSeenDate.toLocaleDateString('ru-RU')}`;
    }
  };

  // Клиент выбирает специалиста
  const handleSelectSpecialist = async () => {
    if (!response || !applicationId) return;
    
    try {
      setResponseLoading(true);
      await apiClient.post(`/api/applications/${applicationId}/responses/${response._id}/accept`);
      
      // Reload response data and application
      await loadResponseData(applicationId, currentUser._id);
      await loadApplicationData(applicationId);
      
      Alert.alert('Успешно', 'Вы выбрали этого специалиста. Ожидается его подтверждение.');
    } catch (err) {
      Alert.alert('Ошибка', err?.response?.data?.message || 'Не удалось выбрать специалиста');
    } finally {
      setResponseLoading(false);
    }
  };

  // Клиент отклоняет отклик
  const handleRejectResponse = async () => {
    if (!response || !applicationId) return;
    
    Alert.alert('Отклонить отклик?', 'Вы точно хотите отклонить этого специалиста?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Отклонить',
        style: 'destructive',
        onPress: async () => {
          try {
            setResponseLoading(true);
            await apiClient.post(`/api/applications/${applicationId}/responses/${response._id}/decline`);
            
            // Reload
            await loadResponseData(applicationId, currentUser._id);
            await loadApplicationData(applicationId);
            
            Alert.alert('Успешно', 'Вы отклонили этого специалиста.');
          } catch (err) {
            Alert.alert('Ошибка', err?.response?.data?.message || 'Не удалось отклонить отклик');
          } finally {
            setResponseLoading(false);
          }
        },
      },
    ]);
  };

  // Специалист подтверждает выбор
  const handleConfirmProposal = async () => {
    if (!response || !applicationId) return;
    
    try {
      setResponseLoading(true);
      await apiClient.post(`/api/applications/${applicationId}/responses/${response._id}/confirm`);
      
      // Reload
      await loadResponseData(applicationId, currentUser._id);
      await loadApplicationData(applicationId);
      
      Alert.alert('Успешно', 'Вы подтвердили выбор. Заказ перешёл в статус "в работе".');
    } catch (err) {
      Alert.alert('Ошибка', err?.response?.data?.message || 'Не удалось подтвердить выбор');
    } finally {
      setResponseLoading(false);
    }
  };

  // Специалист отклоняет выбор
  const handleDeclineProposal = async () => {
    if (!response || !applicationId) return;
    
    Alert.alert('Отклонить выбор?', 'Вы точно хотите отклонить этот заказ?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Отклонить',
        style: 'destructive',
        onPress: async () => {
          try {
            setResponseLoading(true);
            await apiClient.post(`/api/applications/${applicationId}/responses/${response._id}/decline`);
            
            // Reload
            await loadResponseData(applicationId, currentUser._id);
            await loadApplicationData(applicationId);
            
            Alert.alert('Успешно', 'Вы отклонили этот заказ.');
          } catch (err) {
            Alert.alert('Ошибка', err?.response?.data?.message || 'Не удалось отклонить заказ');
          } finally {
            setResponseLoading(false);
          }
        },
      },
    ]);
  };

  // Специалист отмечает работу как завершённую
  const handleMarkWorkComplete = async () => {
    if (!applicationId) return;
    
    Alert.alert('Завершить работу?', 'Отметить работу как завершённую? Клиент должен будет подтвердить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Завершить',
        onPress: async () => {
          try {
            setResponseLoading(true);
            await apiClient.post(`/api/applications/${applicationId}/markWorkComplete`);
            
            // Reload
            await loadApplicationData(applicationId);
            
            Alert.alert('Успешно', 'Работа отмечена как завершённая.');
          } catch (err) {
            Alert.alert('Ошибка', err?.response?.data?.message || 'Ошибка при отметке работы');
          } finally {
            setResponseLoading(false);
          }
        },
      },
    ]);
  };

  // Клиент принимает работу
  const handleAcceptWork = async () => {
    if (!applicationId) return;
    
    try {
      setResponseLoading(true);
      await apiClient.post(`/api/applications/${applicationId}/acceptWork`);
      
      // Reload
      await loadApplicationData(applicationId);
      
      Alert.alert('Успешно', 'Вы подтвердили приём работы. Теперь оставьте отзыв.');
    } catch (err) {
      Alert.alert('Ошибка', err?.response?.data?.message || 'Ошибка при приёме работы');
    } finally {
      setResponseLoading(false);
    }
  };

  // Отправка отзыва
  const handleSubmitReview = async (reviewData) => {
    if (!applicationId) return;
    
    try {
      setReviewSubmitting(true);
      
      const formData = new FormData();
      formData.append('rating', reviewData.rating);
      formData.append('text', reviewData.text);
      
      if (reviewData.image) {
        const fileName = reviewData.image.split('/').pop();
        const fileType = 'image/' + fileName.split('.').pop();
        formData.append('image', {
          uri: Platform.OS === 'ios' ? reviewData.image.replace('file://', '') : reviewData.image,
          type: fileType,
          name: fileName,
        });
      }
      
      await apiClient.post(`/api/applications/${applicationId}/createReview`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setReviewModalVisible(false);
      
      // Reload
      await loadApplicationData(applicationId);
      
      Alert.alert('Успешно', 'Ваш отзыв добавлен. Заказ закрыт.');
    } catch (err) {
      Alert.alert('Ошибка', err?.response?.data?.message || 'Ошибка при отправке отзыва');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser || !currentConversationId) {
      return;
    }

    try {
      setSending(true);
      const messageContent = messageText.trim();
      setMessageText('');

      // Send message via REST API
      try {
        const response = await apiClient.post('/api/messages', {
          conversationId: currentConversationId,
          to: otherUserId,
          text: messageContent,
        });
        const msg = response?.data?.data || response?.data || null;
        if (msg) {
          setMessages([...messages, msg]);
        }
      } catch (restError) {
        console.error('Error sending message:', restError);
        Alert.alert('Ошибка', 'Не удалось отправить сообщение');
        setMessageText(messageContent);
      }
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isCurrentUser = item.from === currentUser?._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.chatHeaderTouchable}
            onPress={() => navigation.navigate('SpecialistProfileView', { userId: otherUserId, userName: otherUserName })}
          >
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{otherUserName}</Text>
                <Text style={styles.headerSubtitle}>Загрузка...</Text>
              </View>
              <View style={{ width: 28 }} />
            </View>
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Header with specialist info */}
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.chatHeaderTouchable}
          onPress={() => navigation.navigate('SpecialistProfileView', { userId: otherUserId, userName: otherUserName })}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#000" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{otherUserName}</Text>
              <Text style={styles.headerSubtitle}>{getOnlineStatus()}</Text>
            </View>
            <View style={{ width: 28 }} />
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      {accessDenied ? (
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="lock-closed" size={64} color="#999" style={styles.lockIcon} />
          <Text style={styles.accessDeniedTitle}>Доступ закрыт</Text>
          <Text style={styles.accessDeniedText}>
            Вы сможете просмотреть переписку после того, как клиент отправит первое сообщение.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesContent}
            inverted={false}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              application ? (
                <View style={styles.applicationCard}>
                  {/* Header */}
                  <View style={styles.applicationHeader}>
                    <Ionicons name="document-text" size={20} color="#EC1B23" />
                    <Text style={styles.applicationTitle}>{application.title}</Text>
                  </View>

                  {/* Info */}
                  {application.info && (
                    <Text style={styles.applicationInfo}>{application.info}</Text>
                  )}

                  {/* Details Grid */}
                  <View style={styles.detailsGrid}>
                    {application.summ && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Бюджет</Text>
                        <Text style={styles.detailValue}>{application.summ} ₸</Text>
                      </View>
                    )}
                    {application.deadline && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Срок</Text>
                        <Text style={styles.detailValue}>
                          {new Date(application.deadline).toLocaleDateString('ru-RU')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Categories */}
                  {application.categories && application.categories.length > 0 && (
                    <View style={styles.categoriesContainer}>
                      <Text style={styles.categoriesLabel}>Категории:</Text>
                      <View style={styles.categoriesList}>
                        {application.categories.map((cat, idx) => (
                          <View key={idx} style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                              {cat.name || cat}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Status Badge */}
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>
                      {application.status === 'open' ? '🟢 Открыт' : 
                       application.status === 'in_progress' ? '🟠 В работе' : 
                       '✅ Завершён'}
                    </Text>
                  </View>

                  {/* Action Buttons - Depend on role and status */}
                  {response && response.status !== 'rejected' && application.status === 'open' && (
                    <View style={styles.actionButtons}>
                      {/* Client: Reject or Select Specialist */}
                      {currentUser?.role === 'user' && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={handleRejectResponse}
                            disabled={responseLoading}
                          >
                            {responseLoading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="close-circle" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Отклонить</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={handleSelectSpecialist}
                            disabled={responseLoading}
                          >
                            {responseLoading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Выбрать</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Specialist: Confirm or Decline if pending confirmation */}
                      {currentUser?.role === 'specialist' && application.pendingSpecialistConfirmation && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={handleDeclineProposal}
                            disabled={responseLoading}
                          >
                            {responseLoading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="close-circle" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Отклонить</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={handleConfirmProposal}
                            disabled={responseLoading}
                          >
                            {responseLoading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Согласиться</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}

                  {/* Work Completion Buttons - When in_progress */}
                  {application.status === 'in_progress' && !application.workAccepted && (
                    <View style={styles.actionButtons}>
                      {/* Specialist: Mark work complete */}
                      {currentUser?.role === 'specialist' && !application.workCompleted && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.completeButton]}
                          onPress={handleMarkWorkComplete}
                          disabled={responseLoading}
                        >
                          {responseLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-done" size={16} color="#fff" />
                              <Text style={styles.actionButtonText}>Работа сделана</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Client: Accept work when specialist marked complete */}
                      {currentUser?.role === 'user' && application.workCompleted && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={handleAcceptWork}
                          disabled={responseLoading}
                        >
                          {responseLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle" size={16} color="#fff" />
                              <Text style={styles.actionButtonText}>Принять работу</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Review Button - When work accepted */}
                  {application.status === 'in_progress' && application.workAccepted && !application.review && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.reviewButton]}
                      onPress={() => setReviewModalVisible(true)}
                      disabled={responseLoading}
                    >
                      <Ionicons name="star" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Оставить отзыв</Text>
                    </TouchableOpacity>
                  )}

                  {/* Closed Status */}
                  {application.status === 'closed' && (
                    <View style={styles.closedBanner}>
                      <Ionicons name="checkmark-done-circle" size={20} color="#4CAF50" />
                      <Text style={styles.closedBannerText}>Заказ завершён</Text>
                    </View>
                  )}
                </View>
              ) : null
            }
          />

          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Напишите сообщение..."
                placeholderTextColor="#999"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
                editable={!sending}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!messageText.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Review Modal */}
          <ReviewModal
            visible={reviewModalVisible}
            onClose={() => setReviewModalVisible(false)}
            onSubmit={handleSubmitReview}
            loading={reviewSubmitting}
            userName={otherUserName}
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  safeArea: {
    backgroundColor: '#fff',
  },
  chatHeaderTouchable: {
    width: '100%',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 20,
  },
  lockIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  accessDeniedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  messagesContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  applicationCard: {
    backgroundColor: '#FFF9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EC1B23',
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  applicationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  applicationInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  applicationBadge: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  applicationBadgeText: {
    fontSize: 11,
    color: '#EC1B23',
    fontWeight: '600',
  },
  applicationDate: {
    fontSize: 11,
    color: '#999',
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  currentUserMessage: {
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  currentUserBubble: {
    backgroundColor: '#EC1B23',
  },
  otherUserBubble: {
    backgroundColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTime: {
    color: '#999',
  },
  inputArea: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EC1B23',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 8,
  },
  detailItem: {
    flex: 1,
    backgroundColor: '#FFF0F2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  categoriesContainer: {
    marginVertical: 12,
  },
  categoriesLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
    fontWeight: '500',
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#EC1B23',
    fontWeight: '500',
  },
  statusContainer: {
    marginVertical: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF9F9',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#EC1B23',
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  reviewButton: {
    backgroundColor: '#FFB800',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  closedBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default ChatScreen;
