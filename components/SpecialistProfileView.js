import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import CreateProposalModal from './CreateProposalModal';

const SpecialistProfileView = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [creating, setCreating] = useState(false);
  const [proposalModalVisible, setProposalModalVisible] = useState(false);
  const [hasActiveProposal, setHasActiveProposal] = useState(false);
  const [activeProposalAppId, setActiveProposalAppId] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (user) {
      checkActiveProposal();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/users/${userId}`);
      const u = response?.data?.data || response?.data || null;
      if (u) {
        const normalizedUser = {
          ...u,
          city: u.city && (u.city.name || u.city),
          categories: (u.categories || []).map((c) => {
            if (!c) return null;
            if (typeof c === 'string') return c;
            if (typeof c === 'object') return c.name || c.title || String(c._id || c.id || JSON.stringify(c));
            return String(c);
          }).filter(Boolean),
        };
        setUser(normalizedUser);
      }

      // Load reviews for this user
      try {
        const reviewsResponse = await apiClient.get(`/api/users/${userId}/reviews`);
        const rv = reviewsResponse?.data?.data || reviewsResponse?.data || [];
        if (Array.isArray(rv)) setReviews(rv);
      } catch (err) {
        console.log('Reviews not available');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  };

  // Format online status
  const getOnlineStatus = (lastSeen) => {
    if (!lastSeen) return 'Статус неизвестен';
    
    const lastSeenDate = new Date(lastSeen);
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

  const handleSendProposal = () => {
    if (hasActiveProposal && activeProposalAppId) {
      navigation.navigate('ChatScreen', {
        conversationId: null,
        otherUserId: user?._id || userId,
        otherUserName: user?.name || '',
        applicationId: activeProposalAppId,
      });
      return;
    }

    setProposalModalVisible(true);
  };

  const checkActiveProposal = async () => {
    try {
      const currentUserStr = await AsyncStorage.getItem('@currentUser');
      if (!currentUserStr) return;
      const currentUser = JSON.parse(currentUserStr);

      const res = await apiClient.get(`/api/applications/user/${currentUser._id || currentUser.id}`);
      const apps = res?.data?.data || res?.data || [];
      if (Array.isArray(apps)) {
        const targetId = user?._id || userId;
        const found = apps.find((a) => {
          const cs = a.currentSpecialist || a.currentSpecialist?._id;
          return a.mode === 'proposal' && a.proposalStatus === 'active' && (String(cs) === String(targetId) || String(a.currentSpecialist) === String(targetId));
        });
        if (found) {
          setHasActiveProposal(true);
          setActiveProposalAppId(found._id || found.id);
          return;
        }
      }
      setHasActiveProposal(false);
      setActiveProposalAppId(null);
    } catch (err) {
      console.log('Active proposal check error', err);
    }
  };

  const handleCreateProposal = async ({ title, description }) => {
    try {
      setCreating(true);
      
      // Check for valid token before attempting to create
      const accessToken = await AsyncStorage.getItem('@accessToken');
      const currentUserStr = await AsyncStorage.getItem('@currentUser');
      
      if (!accessToken || !currentUserStr) {
        Alert.alert('Требуется авторизация', 'Пожалуйста, войдите в аккаунт, чтобы отправить предложение');
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
        return;
      }
      
      const currentUser = JSON.parse(currentUserStr);

      const payload = {
        title: title,
        info: description,
        currentSpecialist: user?._id || userId,
        userID: currentUser._id || currentUser.id,
        mode: 'proposal',
        status: 'new',
      };

      const res = await apiClient.post('/api/applications', payload);
      const created = res?.data?.data || res?.data;

      // Open chat with created application attached
      setProposalModalVisible(false);
      navigation.navigate('ChatScreen', {
        conversationId: null,
        otherUserId: user?._id || userId,
        otherUserName: user?.name || '',
        applicationId: created?._id || created?.id,
      });
    } catch (err) {
      console.error('Error creating proposal:', err, err?.response?.data);
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      if (status === 401) {
        Alert.alert('Требуется авторизация', 'Токен истёк. Пожалуйста, войдите ещё раз.');
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
      } else if (serverMessage) {
        Alert.alert('Ошибка', serverMessage);
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить предложение');
      }
    } finally {
      setCreating(false);
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

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.author?.name || 'Аноним'}</Text>
        <View style={styles.starsRow}>{renderStars(item.rating)}</View>
      </View>
      {item.text && <Text style={styles.reviewText}>{item.text}</Text>}
      <Text style={styles.reviewDate}>
        {new Date(item.createdAt).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Профиль</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Профиль</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Пользователь не найден</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профиль специалиста</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={48} color="#999" />
            </View>
          )}
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.onlineStatus}>{getOnlineStatus(user.lastSeen)}</Text>
          <Text style={styles.userCity}>{user.city || 'Город не указан'}</Text>

          {/* Rating */}
          <View style={styles.ratingBox}>
            <View style={styles.starsRow}>{renderStars(user.rating)}</View>
            <Text style={styles.ratingValue}>
              {user.rating ? user.rating.toFixed(1) : '0'} ({user.reviewCount || 0} отзывов)
            </Text>
          </View>
        </View>

        {/* About Section */}
        {user.about && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Обо мне</Text>
            <Text style={styles.aboutText}>{user.about}</Text>
          </View>
        )}

        {/* Categories */}
        {user.categories && user.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Категории</Text>
            <View style={styles.categoriesContainer}>
              {user.categories.map((cat, idx) => (
                <View key={idx} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Portfolio/Verification */}
        {user.portfolio && user.portfolio.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Портфолио</Text>
            <FlatList
              data={user.portfolio}
              renderItem={({ item }) => (
                <View style={styles.portfolioItem}>
                  {item.url && item.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <Image source={{ uri: item.url }} style={styles.portfolioImage} />
                  ) : (
                    <View style={styles.portfolioPlaceholder}>
                      <Ionicons name="document" size={32} color="#999" />
                    </View>
                  )}
                </View>
              )}
              keyExtractor={(item, idx) => idx.toString()}
              horizontal
              scrollEnabled={true}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Verification */}
        {user.isVerified && (
          <View style={styles.section}>
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.verificationText}>Профиль верифицирован</Text>
            </View>
          </View>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Отзывы ({reviews.length})</Text>
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.fixedButtonContainer} pointerEvents={creating ? 'none' : 'auto'}>
        <TouchableOpacity style={styles.fixedButton} onPress={handleSendProposal} disabled={creating}>
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.fixedButtonText}>{hasActiveProposal ? 'Открыть чат' : 'Отправить предложение'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <CreateProposalModal
        visible={proposalModalVisible}
        onClose={() => setProposalModalVisible(false)}
        onSubmit={handleCreateProposal}
        specialistName={user?.name || userName || ''}
        isLoading={creating}
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
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  onlineStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  userCity: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  ratingBox: {
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  ratingValue: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  portfolioItem: {
    marginRight: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: 120,
    height: 120,
  },
  portfolioPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
  },
  verificationText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  reviewText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
    marginBottom: 6,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  fixedButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'transparent',
  },
  fixedButton: {
    backgroundColor: '#EC1B23',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  fixedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SpecialistProfileView;
