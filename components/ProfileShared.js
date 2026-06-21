import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../utils/apiClient';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ProfileShared({ navigation, role: roleProp }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState(null);

  const roleFromStorage = async () => {
    const r = await AsyncStorage.getItem('@currentRole');
    return r === 'profi' ? 'specialist' : (r === 'specialist' ? 'specialist' : 'user');
  };

  useEffect(() => {
    load();
  }, []);

  // Обновляем профиль при каждом возврате на экран
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [navigation]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request('get', '/api/users/me');
      if (res.data && res.data.success) {
        const userData = res.data.data || {};
        setUser(userData);
        setIsAvailable(userData.isAvailable !== false);
        await AsyncStorage.setItem('@currentUser', JSON.stringify(userData));
        
        // Загружаем статистику для специалистов
        if (userData.role === 'specialist') {
          try {
            const statsRes = await apiClient.request('get', `/api/users/stats/${userData._id}`);
            if (statsRes.data && statsRes.data.success) {
              setStats(statsRes.data.data);
            }
          } catch (err) {
            console.error('load stats', err);
          }
        }
      } else {
        const cur = await AsyncStorage.getItem('@currentUser');
        if (cur) setUser(JSON.parse(cur));
      }
    } catch (err) {
      const cur = await AsyncStorage.getItem('@currentUser');
      if (cur) setUser(JSON.parse(cur));
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
      if (res.cancelled || !res.assets || !res.assets.length) return;
      const asset = res.assets[0];
      const uri = asset.uri; const filename = uri.split('/').pop();
      const match = (filename || '').match(/\.([0-9a-z]+)(?:\?|$)/i); const type = match ? `image/${match[1]}` : 'image/jpeg';
      const form = new FormData(); form.append('avatar', { uri, name: filename, type });
      const uploadRes = await apiClient.uploadAvatar(form);
      if (uploadRes.data && uploadRes.data.success) {
        setUser(uploadRes.data.data);
        await AsyncStorage.setItem('@currentUser', JSON.stringify(uploadRes.data.data));
      }
    } catch (err) { console.error('avatar upload', err); }
  };

  const pickAndUploadPortfolio = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      if (res.cancelled || !res.assets || !res.assets.length) return;
      const asset = res.assets[0];
      const uri = asset.uri; const filename = uri.split('/').pop();
      const match = (filename || '').match(/\.([0-9a-z]+)(?:\?|$)/i); const type = match ? `image/${match[1]}` : 'image/jpeg';
      const form = new FormData(); form.append('files', { uri, name: filename, type });
      const uploadRes = await apiClient.uploadPortfolio(form);
      if (uploadRes.data && uploadRes.data.success) {
        setUser(uploadRes.data.data);
        await AsyncStorage.setItem('@currentUser', JSON.stringify(uploadRes.data.data));
      }
    } catch (err) { console.error('portfolio upload', err); }
  };

  const removePortfolio = async (url) => {
    try {
      const res = await apiClient.deletePortfolio(url);
      if (res.data && res.data.success) {
        setUser(res.data.data);
        await AsyncStorage.setItem('@currentUser', JSON.stringify(res.data.data));
      }
    } catch (err) { console.error('remove portfolio', err); }
  };

  const toggleAvailability = async (val) => {
    try {
      setIsAvailable(val);
      await apiClient.request('put', '/api/users/me', { isAvailable: val });
      // refresh
      const r = await apiClient.request('get', '/api/users/me');
      if (r.data && r.data.success) setUser(r.data.data);
    } catch (err) { console.error('toggle', err); setIsAvailable(!val); }
  };

  const switchMode = async (newMode) => {
    try {
      setLoading(true);
      const res = await apiClient.switchMode(newMode);
      if (res.data && res.data.success) {
        const updatedUser = res.data.data;
        setUser(updatedUser);
        await AsyncStorage.setItem('@currentUser', JSON.stringify(updatedUser));
        // Обновим роль в AsyncStorage (совместимость со старым кодом)
        const roleStr = newMode === 'specialist' ? 'profi' : 'user';
        await AsyncStorage.setItem('@currentRole', roleStr);
        // Переходим на корневой таб для нужного режима
        const target = newMode === 'specialist' ? 'TabPro' : 'TabNav';
        navigation.reset({
          index: 0,
          routes: [{ name: target }],
        });
      }
    } catch (err) {
      console.error('switch mode error', err);
      alert('Ошибка при переключении режима');
    } finally {
      setLoading(false);
    }
  };

  const openEditProfile = () => navigation.navigate('EditProfile');

  const openManageCategories = () => navigation.navigate('Управление категориями');

  const handleLogout = async () => {
    try {
      // Remove all auth-related data from AsyncStorage
      await AsyncStorage.removeItem('@accessToken');
      await AsyncStorage.removeItem('@refreshToken');
      await AsyncStorage.removeItem('@currentUser');
      await AsyncStorage.removeItem('@currentRole');
      
      // Reset navigation to Auth screen using CommonActions
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    } catch (err) {
      console.error('Logout error:', err);
      alert('Ошибка при выходе из аккаунта');
    }
  };

  const baseRole = roleProp || (user.role || 'user');
  const activeRole = user.activeRole || baseRole;

  if (loading) return <SafeAreaView style={s.center}><ActivityIndicator size="large" color="#EC1B23"/></SafeAreaView>;

  return (
    <SafeAreaView style={s.wrapper}>
      <ScrollView>
        <View style={s.infoContainer}>
          <View style={s.avaContainer}>
            <Image source={user.avatarUrl ? { uri: user.avatarUrl } : require('../assets/man.jpg')} style={s.ava} />
            <TouchableOpacity style={s.editAvatarButton} onPress={pickAndUploadAvatar}><Ionicons name="pencil" size={18} color="#fff"/></TouchableOpacity>
          </View>
          <Text style={s.name}>{(user.surname || '') + ' ' + (user.name || '')}</Text>
          {user.city && <View style={s.infoRow}><Ionicons name="location" size={16} color="#EC1B23"/><Text style={s.infoText}>{user.city.name}</Text></View>}
          <TouchableOpacity style={[s.AuthButton, { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20 }]} onPress={openEditProfile}>
            <Text style={s.buttonText}>Редактировать профиль</Text>
          </TouchableOpacity>
        </View>

        {/* Availability for specialists */}
        {baseRole === 'specialist' && (
          <View style={s.geoContainer1}>
            <Text style={s.titleGeo}>Готов к новым заказам</Text>
            <Switch value={isAvailable} onValueChange={toggleAvailability} />
          </View>
        )}

        {/* Mode Switch Button */}
        {(baseRole === 'specialist' || activeRole === 'specialist') && (
          <TouchableOpacity 
            style={[s.modeSwitchButton, activeRole === 'specialist' && s.modeSwitchButtonActive]}
            onPress={() => switchMode(activeRole === 'specialist' ? 'user' : 'specialist')}
          >
            <Ionicons 
              name={activeRole === 'specialist' ? 'briefcase' : 'person'} 
              size={24} 
              color="#fff" 
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.modeSwitchButtonText}>
                {activeRole === 'specialist' ? 'Режим заказчика' : 'Режим специалиста'}
              </Text>
              <Text style={s.modeSwitchButtonSubText}>
                {activeRole === 'specialist' 
                  ? 'Перейти в режим заказчика' 
                  : 'Перейти в режим специалиста'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Rating (specialist) */}
        {baseRole === 'specialist' && stats && (
          <TouchableOpacity 
            style={s.ratingCard}
            onPress={() => navigation.navigate('Reviews', { userId: user._id })}
          >
            <View style={s.ratingContent}>
              <View style={s.ratingLeft}>
                <Text style={s.ratingNumber}>{stats.averageRating || 0}</Text>
                <Ionicons name="star" size={20} color="#FFC107" style={{ marginLeft: 4 }} />
              </View>
              <View style={s.ratingRight}>
                <Text style={s.ratingLabel}>{stats.totalReviews || 0} отзывов</Text>
                <Text style={s.ratingSubLabel}>{stats.completedApplications || 0} заказов</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#EC1B23" />
            </View>
          </TouchableOpacity>
        )}

        {/* About */}
        <View style={s.geoContainer4}>
          <Text style={s.titleGeo4}>О себе</Text>
          <Text style={s.pText}>{user.about || 'Информация не заполнена'}</Text>
        </View>

        {/* Categories (specialist) */}
        {baseRole === 'specialist' && (
          <View style={s.geoContainer4}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={s.titleGeo4}>Категории</Text>
              <TouchableOpacity onPress={openManageCategories}>
                <Ionicons name="pencil" size={20} color="#EC1B23" />
              </TouchableOpacity>
            </View>
            {(user.categories || []).length === 0 ? (
              <Text style={s.pText}>Категории не выбраны</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(user.categories || []).map((cat, i) => (
                  <View key={i} style={s.categoryTag}>
                    <Text style={s.categoryTagText}>{cat.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Portfolio */}
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Портфолио</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(user.portfolio || []).length === 0 ? <Text style={{ color: '#999' }}>Портфолио пусто</Text> : (
              (user.portfolio || []).map((u, i) => (
                <View key={i} style={{ marginRight: 10 }}>
                  <Image source={{ uri: u }} style={{ width: 120, height: 120, borderRadius: 8 }} />
                  <TouchableOpacity onPress={() => removePortfolio(u)} style={{ position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 16 }}>
                    <Ionicons name="trash" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity onPress={pickAndUploadPortfolio} style={[s.AuthButton, { marginTop: 12, alignSelf: 'stretch', paddingVertical: 12 }]}>
            <Text style={s.buttonText}>Добавить в портфолио</Text>
          </TouchableOpacity>
        </View>

        {/* Orders History - for customers only */}
        {activeRole === 'user' && (
          <TouchableOpacity 
            style={[s.geoContainer1, { marginTop: 16, marginBottom: 8 }]}
            onPress={() => navigation.navigate('OrdersHistory', { userId: user._id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.titleGeo}>История заказов</Text>
              <Text style={{ color: '#666', marginTop: 4, fontSize: 12 }}>
                Все ваши заказы и отклики
              </Text>
            </View>
            <Ionicons size={24} color={'#EC1B23'} name="chevron-forward" />
          </TouchableOpacity>
        )}

        {/* Verification - for specialists only */}
        {baseRole === 'specialist' && (
          <TouchableOpacity 
            style={[s.geoContainer1, { marginTop: 16, marginBottom: 16 }]}
            onPress={() => navigation.navigate('Verification')}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.titleGeo}>Верификация</Text>
              <Text style={{ color: user.verification?.status === 'verified' ? '#4CAF50' : (user.verification?.status === 'pending' ? '#FF9800' : '#999'), marginTop: 4, fontSize: 12 }}>
                {user.verification?.status === 'verified' 
                  ? '✓ Подтверждено'
                  : (user.verification?.status === 'pending' 
                    ? '⏳ На проверке'
                    : '○ Не начиналось'
                  )
                }
              </Text>
            </View>
            <Ionicons size={24} color={'#EC1B23'} name="chevron-forward" />
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={[s.AuthButton, { marginHorizontal: 16, marginTop: 20, marginBottom: 40, backgroundColor: '#999' }]}
          onPress={handleLogout}
        >
          <Text style={s.buttonText}>Выйти из аккаунта</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F2F2F2' },
  center: { flex:1, alignItems:'center', justifyContent:'center' },
  infoContainer: { alignItems: 'center', backgroundColor: '#fff', width:'100%', marginTop: 25, paddingVertical:25, borderRadius: 20, paddingHorizontal:20 },
  avaContainer: { marginTop: 10, width: 140, height: 140, borderRadius: 200, padding: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  ava: { width: 120, height: 120, borderRadius: 200, resizeMode: 'cover' },
  editAvatarButton: { position: 'absolute', right: 6, bottom: 6, backgroundColor: '#000', padding: 8, borderRadius: 20 },
  name: { fontSize: 20, fontWeight: '500', marginTop: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  infoText: { marginLeft: 8, fontSize: 13, color: '#555' },
  geoContainer1: { backgroundColor: '#fff', marginTop: 20, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16 },
  geoContainer4: { backgroundColor: '#fff', marginTop: 20, borderRadius: 10, padding: 16, marginHorizontal: 16 },
  titleGeo: { fontSize: 16, fontWeight: '500' },
  titleGeo4: { fontSize: 16, fontWeight: '700' },
  pText: { color: '#555', marginTop: 6 },
  AuthButton: { height: 48, borderRadius: 12, backgroundColor: '#EC1B23', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  categoryTag: { 
    backgroundColor: '#FFE5E7', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#EC1B23' 
  },
  categoryTagText: { color: '#EC1B23', fontSize: 12, fontWeight: '600' },
  ratingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    padding: 16,
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  ratingRight: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ratingSubLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  modeSwitchButton: {
    backgroundColor: '#EC1B23',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modeSwitchButtonActive: {
    backgroundColor: '#EC1B23',
  },
  modeSwitchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modeSwitchButtonSubText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  }
});
