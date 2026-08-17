import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';
import { SkeletonCard } from './SkeletonLoader';

const ChatListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadMyResponses = async () => {
    try {
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user?._id || user?.id;
      if (!userId) return;

      const res = await apiClient.get('/api/applications');
      const applications = res?.data?.data || res?.data || [];
      if (!Array.isArray(applications)) {
        setResponses([]);
        return;
      }

      const result = [];
      for (const app of applications) {
        try {
          const responsesRes = await apiClient.get(`/api/applications/${app._id}/responses`);
          const list = responsesRes?.data?.data || responsesRes?.data || [];
          const myResponse = (Array.isArray(list) ? list : []).find(r => {
            const specialistId = r?.specialist?._id || r?.specialist || r?.specialistId;
            return String(specialistId) === String(userId);
          });

          if (myResponse) {
            result.push({
              _id: myResponse._id || `${app._id}-${userId}`,
              applicationId: app._id,
              conversationId: myResponse.conversationId,
              applicationTitle: app.title || 'Заявка',
              status: myResponse.status,
              user: app.user,
            });
          }
        } catch (e) {
          // ignore per app errors
        }
      }
      setResponses(result);
    } catch (error) {
      console.log('My responses load failed', error);
      setResponses([]);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        // Load conversations for this user
        const res = await apiClient.get('/api/conversations');
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list)) {
          const userConvs = list.filter(conv =>
            conv.participants?.some(p => (p._id || p.id) === (user._id || user.id))
          );
          
          // Sort by last message date (descending)
          const sorted = userConvs.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0);
            const dateB = new Date(b.updatedAt || b.createdAt || 0);
            return dateB - dateA;
          });

          // Calculate total unread chats
          const totalUnread = sorted.filter(conv => (conv.unreadCount || 0) > 0).length;
          
          // Store unread count to global state (можно использовать Redux или Context)
          if (global.setUnreadChatsCount) {
            global.setUnreadChatsCount(totalUnread);
          }

          setConversations(sorted);
        }

        await loadMyResponses();
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      Toast.error('Не удалось загрузить чаты');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
    Toast.success('Обновлено');
  };

  const getOtherUser = (conv) => {
    if (!conv.participants || conv.participants.length < 2) return null;
    const currentUserId = currentUser?._id || currentUser?.id;
    const other = conv.participants.find((p) => {
      const pid = p?._id || p?.id || p;
      return String(pid) !== String(currentUserId);
    });
    return other;
  };

  const getConversationApplicationData = (conv) => {
    const applicationId = conv?.application?._id || conv?.application || conv?.applicationId || null;
    const applicationTitle = conv?.application?.title || conv?.applicationTitle || conv?.title || 'Заявка';
    return { applicationId, applicationTitle };
  };

  const handleChatPress = (conv) => {
    const other = getOtherUser(conv);
    if (other) {
      const { applicationId, applicationTitle } = getConversationApplicationData(conv);
      navigation.navigate('ChatScreen', {
        conversationId: conv._id || conv.id,
        otherUserId: other._id || other.id,
        otherUserName: other.name || 'Пользователь',
        applicationId,
        applicationTitle,
      });
    }
  };

  const handleDeleteChat = (conv) => {
    Alert.alert(
      'Удалить чат',
      'Чат будет удалён из списка. Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const convId = conv._id || conv.id;
              await apiClient.delete(`/api/conversations/${convId}`);
              Toast.success('Чат удален');
              await loadChats();
            } catch (error) {
              console.error('Delete chat error:', error);
              Toast.error('Не удалось удалить чат');
            }
          },
        },
      ]
    );
  };

  const renderResponseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.responseItem}
      onPress={() => {
        if (item.applicationId) {
          navigation.navigate('ChatScreen', {
            applicationId: item.applicationId,
            otherUserId: item.user?._id || item.user,
            otherUserName: item.user?.name || 'Заказчик',
            applicationTitle: item.applicationTitle || 'Заявка',
          });
        }
      }}
      activeOpacity={0.8}
    >
      <View style={styles.responseBadge}>
        <Ionicons name="send" size={12} color="#fff" />
      </View>
      <View style={styles.responseContent}>
        <Text style={styles.responseTitle} numberOfLines={1}>{item.applicationTitle || 'Отклик'}</Text>
        <Text style={styles.responseStatus}>
          {item.status === 'accepted' ? 'Принято' : item.status === 'pending' ? 'На рассмотрении' : 'Отправлен'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
  );

  const sectionedData = (() => {
    const pendingResponses = responses.filter(item => item.status === 'pending' || !item.status);
    const chatInProgress = conversations.filter(conv => {
      const appId = conv?.application?._id || conv?.application || conv?.applicationId;
      const matched = responses.find(r => r.applicationId === appId);
      return matched && matched.status === 'accepted';
    });
    const chatStarted = conversations.filter(conv => {
      const appId = conv?.application?._id || conv?.application || conv?.applicationId;
      const hasResponse = responses.some(r => r.applicationId === appId);
      return !hasResponse && conv.lastMessage;
    });
    const closed = conversations.filter(conv => {
      const appId = conv?.application?._id || conv?.application || conv?.applicationId;
      return responses.some(r => r.applicationId === appId && (r.status === 'rejected' || r.status === 'closed'));
    });

    return [
      { title: 'Отклики', data: pendingResponses },
      { title: 'Начала переписки', data: chatStarted },
      { title: 'В работе', data: chatInProgress },
      { title: 'Закрыто', data: closed },
    ].filter(section => section.data.length > 0);
  })();

  const renderSectionHeader = ({ section }) => (
    <Text style={styles.sectionTitle}>{section.title}</Text>
  );

  const renderChatItem = ({ item }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) return null;

    const lastMessage = item.lastMessage || {};
    const lastMessageTime = new Date(lastMessage.createdAt || item.updatedAt || item.createdAt);
    const timeStr = getTimeString(lastMessageTime);
    const preview = lastMessage.text || 'Нет сообщений';
    
    // Count unread messages for this conversation
    const unreadCount = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={styles.avatarBox}>
          {otherUser.avatar ? (
            <View style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {otherUser.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, unreadCount > 0 && styles.nameUnread]} numberOfLines={1}>
              {otherUser.name || 'Неизвестно'}
            </Text>
            <Text style={styles.time}>{timeStr}</Text>
          </View>
          <Text style={[styles.preview, unreadCount > 0 && styles.previewUnread]} numberOfLines={1}>
            {preview}
          </Text>
          {item.applicationId && (
            <View style={styles.appTag}>
              <Ionicons name="document-text-outline" size={12} color="#EC1B23" />
              <Text style={styles.appTagText}>Заявка</Text>
            </View>
          )}
        </View>

        {/* Action */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleDeleteChat(item)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const getTimeString = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Сейчас';
    if (diffMins < 60) return `${diffMins}м`;
    if (diffHours < 24) return `${diffHours}ч`;
    if (diffDays < 7) return `${diffDays}д`;
    return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ddd" />
      <Text style={styles.emptyTitle}>Нет чатов</Text>
      <Text style={styles.emptySub}>Начните беседу с заказчиком или специалистом</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Чаты</Text>
        </View>
        <View style={styles.loadingContent}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чаты</Text>
      </View>

      <SectionList
        sections={sectionedData}
        keyExtractor={(item, index) => item?._id ? String(item._id) : `${item?.applicationId || 'chat'}-${index}`}
        renderItem={({ item, section }) => {
          if (section.title === 'Отклики') {
            return renderResponseItem({ item });
          }
          return renderChatItem({ item });
        }}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  loadingContent: {
    padding: 12,
  },
  list: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 6,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  avatarBox: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#EC1B23',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EC1B23',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  nameUnread: {
    fontWeight: '700',
    color: '#EC1B23',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  preview: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  previewUnread: {
    color: '#333',
    fontWeight: '500',
  },
  appTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff4f1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    gap: 4,
  },
  appTagText: {
    fontSize: 11,
    color: '#EC1B23',
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
  },
  responseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  responseBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EC1B23',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  responseContent: {
    flex: 1,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  responseStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default ChatListScreen;
