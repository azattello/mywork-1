import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
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

  useEffect(() => {
    loadChats();
  }, []);

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
          // Filter conversations for current user and sort by latest message
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
    const other = conv.participants.find(p => (p._id || p.id) !== (currentUser?._id || currentUser?.id));
    return other;
  };

  const handleChatPress = (conv) => {
    const other = getOtherUser(conv);
    if (other) {
      navigation.navigate('ChatScreen', {
        conversationId: conv._id || conv.id,
        otherUserId: other._id || other.id,
        otherUserName: other.name || 'Пользователь',
        applicationId: conv.applicationId,
      });
    }
  };

  const handleDeleteChat = (conv) => {
    if (global.confirmModal) {
      global.confirmModal.show({
        title: 'Удалить чат',
        message: 'Чат будет удален. Это действие необратимо.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        type: 'error',
        onConfirm: async () => {
          try {
            // Delete conversation via API
            const convId = conv._id || conv.id;
            await apiClient.delete(`/api/conversations/${convId}`);
            Toast.success('Чат удален');
            await loadChats();
          } catch (error) {
            console.error('Delete chat error:', error);
            Toast.error('Не удалось удалить чат');
          }
        },
      });
    } else {
      Toast.warning('Функция удаления будет доступна скоро');
    }
  };

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
        <TouchableOpacity onPress={loadChats}>
          <Ionicons name="refresh" size={24} color="#EC1B23" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EC1B23"
          />
        }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  loadingContent: {
    padding: 12,
  },
  list: {
    padding: 8,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
