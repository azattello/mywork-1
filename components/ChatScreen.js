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
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
  const routeParams = route?.params || {};
  const { conversationId, otherUserId, otherUserName } = routeParams;
  const applicationId = routeParams.applicationId || routeParams.application?._id || null;
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [application, setApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [response, setResponse] = useState(null);
  const [responseLoading, setResponseLoading] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(false);
  const [applicationTitle, setApplicationTitle] = useState(route?.params?.applicationTitle || 'Заявка');

  const getUserId = (user) => user?._id || user?.id || null;
  const currentUserId = getUserId(currentUser);
  const normalizedRole = currentUser?.role === 'specialist' || currentUser?.role === 'profi' || currentUser?.activeRole === 'specialist' ? 'specialist' : 'user';

  const socketRef = useRef(null);

  useEffect(() => {
    const loadChat = async () => {
      try {
        if (!otherUserId) {
          setMessages([]);
          setCurrentConversationId(conversationId || null);
          setApplication(null);
          setResponse(null);
          setLoading(false);
          return;
        }

        const userStr = await AsyncStorage.getItem('@currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          const normalizedUser = { ...user, _id: user?._id || user?.id };
          setCurrentUser(normalizedUser);

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
          const validCurrentUserId = normalizedUser?._id || normalizedUser?.id;

          if (!convId && applicationId && validCurrentUserId && otherUserId) {
            const response = await apiClient.post('/api/conversations', {
              participants: [validCurrentUserId, otherUserId],
              applicationId: applicationId,
            });
            const conv = response?.data?.data || response?.data || null;
            convId = conv?._id || conv?.id || convId;
            setCurrentConversationId(convId);
          }

          const chatLoadTasks = [];

          if (convId) {
            chatLoadTasks.push(loadMessages(convId));
          } else {
            setMessages([]);
          }

          if (applicationId) {
            chatLoadTasks.push(loadApplicationData(applicationId));
            chatLoadTasks.push(loadResponseData(applicationId, validCurrentUserId || user?._id || user?.id));
          } else {
            setResponse(null);
          }

          if (chatLoadTasks.length > 0) {
            await Promise.allSettled(chatLoadTasks);
          }

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
                const incoming = payload?.message || payload;
                if (!incoming) return;
                const convIdStr = convId.toString();
                if (payload?.conversation && payload.conversation.toString() !== convIdStr) return;

                setMessages(prev => {
                  if (prev.find(m => m._id === incoming._id)) return prev;
                  return [...prev, incoming].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                });

                if (!incoming.isRead && incoming.from !== user?._id) {
                  apiClient.patch(`/api/messages/${incoming._id}/read`).catch(() => {});
                }
              });

              socketRef.current.on('unlock_chat', (payload) => {
                console.log('Chat unlocked:', payload);
                setAccessDenied(false);
                loadMessages(convId);
              });

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

    loadChat();

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
      try {
        if (socketRef.current && currentConversationId) {
          socketRef.current.emit('leave', currentConversationId);
        }
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
  }, [conversationId, otherUserId, applicationId]);

  const loadApplicationData = async (appId) => {
    if (!appId) {
      setApplication(null);
      setApplicationLoading(false);
      setApplicationTitle(routeParams?.applicationTitle || 'Заявка');
      return;
    }

    setApplicationLoading(true);

    try {
      const res = await apiClient.get(`/api/applications/${appId}`);
      const app = res?.data?.data || res?.data || null;
      if (app) {
        setApplication(app);
        setApplicationTitle(app.title || routeParams?.applicationTitle || 'Заявка');
      } else {
        setApplication(null);
        setApplicationTitle(routeParams?.applicationTitle || 'Заявка');
      }
    } catch (err) {
      console.log('Application not found or already deleted');
      setApplication(null);
      setApplicationTitle(routeParams?.applicationTitle || 'Заявка');
    } finally {
      setApplicationLoading(false);
    }
  };

  const loadResponseData = async (appId, userId) => {
    if (!appId) {
      setResponse(null);
      return;
    }

    try {
      setResponseLoading(true);
      const currentRole = currentUser?.role || currentUser?.activeRole || 'user';
      const effectiveRole = currentRole === 'specialist' || currentRole === 'profi' || currentUser?.activeRole === 'specialist' ? 'specialist' : 'user';
      const targetUserId = effectiveRole === 'specialist' ? (userId || currentUser?._id || currentUser?.id) : otherUserId;
      if (!targetUserId) {
        setResponse(null);
        return;
      }

      try {
        const res = await apiClient.get(`/api/applications/${appId}/responses/${targetUserId}`);
        const resp = res?.data?.data || res?.data || null;
        if (resp) {
          setResponse(resp);
          return;
        }
      } catch (err) {
        console.log('Response not found by specialist id, fallback to list scan');
      }

      const listRes = await apiClient.get(`/api/applications/${appId}/responses`);
      const list = listRes?.data?.data || listRes?.data || [];
      const matched = Array.isArray(list)
        ? list.find((item) => {
            const specialistId = item?.specialist?._id || item?.specialist || item?.specialistId;
            return String(specialistId) === String(targetUserId);
          })
        : null;

      setResponse(matched || null);
    } catch (err) {
      console.log('Response not found');
      setResponse(null);
    } finally {
      setResponseLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    if (!convId) {
      setMessages([]);
      setAccessDenied(false);
      return;
    }

    try {
      setAccessDenied(false);
      const response = await apiClient.get(`/api/messages/${convId}`);
      const list = response?.data?.data || response?.data || [];
      if (Array.isArray(list)) {
        setMessages(list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        
        list.forEach(msg => {
          if (!msg.isRead && msg.from !== currentUser?._id) {
            apiClient.patch(`/api/messages/${msg._id}/read`).catch(() => {});
          }
        });
      }
    } catch (error) {
      if (error?.response?.status === 403) {
        setAccessDenied(true);
        console.log('Access denied - specialist waiting for client first message');
      } else {
        console.error('Error loading messages:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить сообщения');
      }
    }
  };

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

  const handleSelectSpecialist = async () => {
    if (!response || !applicationId) return;
    try {
      setResponseLoading(true);
      await apiClient.post(`/api/applications/${applicationId}/responses/${response._id}/accept`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for server update
      await loadResponseData(applicationId, currentUser._id);
      await loadApplicationData(applicationId);
      Alert.alert('Успешно', 'Вы выбрали этого специалиста. Ожидается его подтверждение.');
    } catch (err) {
      Alert.alert('Ошибка', err?.response?.data?.message || 'Не удалось выбрать специалиста');
    } finally {
      setResponseLoading(false);
    }
  };

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

  const handleConfirmProposal = async () => {
    if (!response || !applicationId) return;
    
    try {
      setResponseLoading(true);
      await apiClient.post(`/api/applications/${applicationId}/responses/${response._id}/confirm`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for server update
      await loadResponseData(applicationId, currentUser._id);
      await loadApplicationData(applicationId);
      Alert.alert('Успешно', 'Вы подтвердили выбор. Заказ перешёл в статус "в работе".');
    } catch (err) {
      Alert.alert('Ошибка', err?.response?.data?.message || 'Не удалось подтвердить выбор');
    } finally {
      setResponseLoading(false);
    }
  };

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
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for server update
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

  const handleAcceptWork = async () => {
    if (!applicationId) return;
    
    try {
      setResponseLoading(true);
      await apiClient.post(`/api/applications/${applicationId}/acceptWork`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for server update
      await loadApplicationData(applicationId);
      Alert.alert('Успешно', 'Вы подтвердили приём работы. Теперь оставьте отзыв.');
    } catch (err) {
      Alert.alert('Ошибка', err?.response?.data?.message || 'Ошибка при приёме работы');
    } finally {
      setResponseLoading(false);
    }
  };

  const handleOpenReviewScreen = () => {
    if (!applicationId) return;

    navigation.navigate('ReviewScreen', {
      applicationId,
      userName: otherUserName || 'Специалист',
      onReviewSubmitted: async () => {
        await loadApplicationData(applicationId);
      },
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser || !currentConversationId) {
      return;
    }

    try {
      setSending(true);
      const messageContent = messageText.trim();
      setMessageText('');

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
    const resolveUserId = (user) => {
      if (!user) return '';
      if (typeof user === 'string') return user;
      if (typeof user === 'object') return String(user._id || user.id || user.userId || '');
      return String(user);
    };

    const senderId = resolveUserId(item?.from || item?.sender || item?.user);
    const currentUserId = resolveUserId(currentUser);
    const isCurrentUser = String(senderId) === String(currentUserId);

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
    );
  };

  // Компактная карточка заявки для всегда видного отображения
  const renderActionButton = ({
    label,
    onPress,
    variant = 'acceptBtn',
    disabled = false,
    loading = false,
    fullWidth = false,
  }) => (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        styles[variant],
        fullWidth && styles.actionBtnFullWidth,
        (disabled || loading) && styles.actionBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.actionBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  const renderApplicationCard = () => {
    const app = application || { _id: applicationId, title: applicationTitle || 'Заявка', status: 'open' };

    const clientHasWrittenFirstMessage = Array.isArray(messages) &&
      messages.some(msg => String(msg.from || msg.sender || msg.user) === String(otherUserId));

    // Если специалист выбран клиентом и ждёт подтверждения, он считается proposedSpecialist.
    const isProposedSpecialist = app.proposedSpecialist && (
      String(app.proposedSpecialist._id || app.proposedSpecialist) === String(currentUser?._id || currentUser?.id)
    );

    // Если уже подтверждён и работает по заказу, специалист считается currentSpecialist.
    const isCurrentSpecialist = app.currentSpecialist && (
      String(app.currentSpecialist._id || app.currentSpecialist) === String(currentUser?._id || currentUser?.id)
    );

    // Для клиента доступ к выбору специалиста должен появляться только после первого сообщения клиента,
    // а не после любого сообщения в переписке.
    const canClientSelectSpecialist = normalizedRole === 'user' &&
      app.status === 'open' &&
      !app.pendingSpecialistConfirmation &&
      !!response &&
      response.status !== 'rejected' &&
      clientHasWrittenFirstMessage;

    const canSpecialistConfirmOrder = normalizedRole === 'specialist' &&
      app.pendingSpecialistConfirmation &&
      isProposedSpecialist;

    const statusColor = 
      app.status === 'open' ? '#4CAF50' :
      app.status === 'in_progress' ? '#FF9800' :
      '#2196F3';

    const statusLabel = 
      app.status === 'open' ? 'Открыта' :
      app.status === 'in_progress' ? 'В работе' :
      'Завершена';

    return (
      <TouchableOpacity
        style={[styles.cardHeader, cardExpanded && styles.cardHeaderExpanded]}
        onPress={() => {
          const detailAppId = app?._id || applicationId;
          if (detailAppId) {
            navigation.navigate('ApplicationDetail', { applicationId: detailAppId });
          }
        }}
        activeOpacity={0.7}
      >
        {/* Compact View */}
        <View style={styles.cardCompact}>
          <View style={styles.cardLeft}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {app.title || applicationTitle}
              </Text>
              {application && app.summ ? (
                <Text style={styles.cardPrice}>{Number(app.summ)} ₸</Text>
              ) : application ? (
                <Text style={styles.cardPrice}>Договорная</Text>
              ) : applicationLoading ? (
                <Text style={[styles.cardPrice, { color: '#999' }]}>Загрузка...</Text>
              ) : (
                <Text style={[styles.cardPrice, { color: '#666' }]}>{app.title || 'Заявка'}</Text>
              )}
            </View>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color="#EC1B23" 
            style={styles.chevron}
          />
        </View>

        {/* Action Buttons */}
        {!accessDenied && (
          <View>
            {normalizedRole === 'user' && app.status === 'open' && !app.pendingSpecialistConfirmation && (
              <Text style={styles.selectionHintText}>
                {clientHasWrittenFirstMessage
                  ? 'После первого контакта можно выбрать специалиста или отклонить отклик.'
                  : 'Напишите первое сообщение, чтобы начать контакт, затем после ответа можно выбрать специалиста.'}
              </Text>
            )}

            <View style={styles.actionButtonsRow}>
              {renderActionButton({
                label: 'Подробнее',
                variant: 'viewBtn',
                onPress: () => {
                  const detailAppId = app?._id || applicationId;
                  if (detailAppId) {
                    navigation.navigate('ApplicationDetail', { applicationId: detailAppId });
                  }
                },
              })}

              {canClientSelectSpecialist && (
                <>
                  {renderActionButton({
                    label: 'Отклонить отклик',
                    variant: 'declineBtn',
                    onPress: handleRejectResponse,
                    disabled: responseLoading,
                    loading: responseLoading,
                  })}
                  {renderActionButton({
                    label: 'Выбрать специалиста',
                    variant: 'acceptBtn',
                    onPress: handleSelectSpecialist,
                    disabled: responseLoading,
                    loading: responseLoading,
                  })}
                </>
              )}

              {canSpecialistConfirmOrder && (
                <>
                  {renderActionButton({
                    label: 'Отклонить заказ',
                    variant: 'declineBtn',
                    onPress: handleDeclineProposal,
                    disabled: responseLoading,
                    loading: responseLoading,
                  })}
                  {renderActionButton({
                    label: 'Подтвердить заказ',
                    variant: 'acceptBtn',
                    onPress: handleConfirmProposal,
                    disabled: responseLoading,
                    loading: responseLoading,
                  })}
                </>
              )}

              {normalizedRole === 'specialist' && app.status === 'in_progress' && isCurrentSpecialist && !app.workCompleted && !app.workAccepted && (
                renderActionButton({
                  label: 'Завершить работу',
                  variant: 'completeBtn',
                  onPress: handleMarkWorkComplete,
                  disabled: responseLoading,
                  loading: responseLoading,
                })
              )}

              {normalizedRole === 'user' && app.status === 'in_progress' && app.workCompleted && !app.workAccepted && (
                renderActionButton({
                  label: 'Подтвердить сдачу',
                  variant: 'acceptBtn',
                  onPress: handleAcceptWork,
                  disabled: responseLoading,
                  loading: responseLoading,
                })
              )}

              {app.status === 'in_progress' && app.workAccepted && !app.review && (
                renderActionButton({
                  label: 'Оставить отзыв',
                  variant: 'reviewBtn',
                  onPress: handleOpenReviewScreen,
                  disabled: false,
                  loading: false,
                })
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
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
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
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
      </SafeAreaView>

      {accessDenied ? (
        <View style={styles.accessDeniedContainer}>
          {renderApplicationCard()}
          <Ionicons name="lock-closed" size={64} color="#999" style={styles.lockIcon} />
          <Text style={styles.accessDeniedTitle}>Доступ закрыт</Text>
          <Text style={styles.accessDeniedText}>
            Вы сможете просмотреть переписку после того, как клиент отправит первое сообщение.
          </Text>
        </View>
      ) : (
        <>
          {/* Application Card - ALWAYS VISIBLE */}
          {renderApplicationCard()}

          {/* Messages */}
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesContent}
            inverted={false}
            scrollEnabled={messages.length > 0}
            nestedScrollEnabled={true}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyText}>Нет сообщений</Text>
              </View>
            }
          />

          {/* Input Area */}
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
    marginTop: 40,
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
  cardHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  cardHeaderExpanded: {
    backgroundColor: '#FFF9F9',
  },
  cardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EC1B23',
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
  selectionHintText: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#666',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionBtnFullWidth: {
    flexGrow: 1,
    minWidth: '45%',
  },
  actionBtnDisabled: {
    opacity: 0.75,
  },
  viewBtn: {
    backgroundColor: '#F2F2F2',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  viewBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
    textAlign: 'center',
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
  },
  declineBtn: {
    backgroundColor: '#EC1B23',
  },
  completeBtn: {
    backgroundColor: '#2196F3',
  },
  reviewBtn: {
    backgroundColor: '#FFB800',
  },
  messagesContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  messageContainer: {
    marginVertical: 6,
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
    paddingVertical: 10,
    borderRadius: 12,
  },
  currentUserBubble: {
    backgroundColor: '#EC1B23',
  },
  otherUserBubble: {
    backgroundColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    maxHeight: 100,
    color: '#000',
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
});

export default ChatScreen;
