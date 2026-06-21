import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../utils/apiClient';

export default function EditProfileScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState({});
  const [editForm, setEditForm] = useState({
    name: '',
    surname: '',
    about: '',
    cityId: '',
    cityName: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  // Если пришли с выбором города - сразу сохраняем
  useEffect(() => {
    if (route?.params?.selectedCity) {
      const city = route.params.selectedCity;
      saveWithCity(city);
    }
  }, [route?.params?.selectedCity]);

  const saveWithCity = async (city) => {
    setSaving(true);
    try {
      const payload = {
        name: editForm.name,
        surname: editForm.surname,
        about: editForm.about,
        city: city._id
      };

      const res = await apiClient.request('put', '/api/users/me', payload);
      if (res.data && res.data.success) {
        const updatedData = res.data.data;
        setUser(updatedData);
        setEditForm(prev => ({
          ...prev,
          cityId: updatedData.city?._id || '',
          cityName: updatedData.city?.name || ''
        }));
        await AsyncStorage.setItem('@currentUser', JSON.stringify(updatedData));
        // Показываем notification что город сохранился
        console.log('Город успешно сохранён:', city.name);
      }
    } catch (err) {
      console.error('save city', err);
    } finally {
      setSaving(false);
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request('get', '/api/users/me');
      if (res.data && res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        setEditForm({
          name: userData.name || '',
          surname: userData.surname || '',
          about: userData.about || '',
          cityId: userData.city?._id || '',
          cityName: userData.city?.name || ''
        });
      }
    } catch (err) {
      console.error('load user', err);
    } finally {
      setLoading(false);
    }
  };

  const openCitySelector = () => {
    navigation.navigate('SelectCity', { selectedCityId: editForm.cityId });
  };

  const saveProfileChanges = async () => {
    setSaving(true);
    try {
      const payload = {
        name: editForm.name,
        surname: editForm.surname,
        about: editForm.about,
      };
      // Отправляем city как есть, даже если она не изменилась
      if (editForm.cityId) {
        payload.city = editForm.cityId;
      }

      console.log('Saving payload:', payload);
      const res = await apiClient.request('put', '/api/users/me', payload);
      console.log('Save response:', res.data);
      
      if (res.data && res.data.success) {
        const updatedData = res.data.data;
        setUser(updatedData);
        setEditForm({
          name: updatedData.name || '',
          surname: updatedData.surname || '',
          about: updatedData.about || '',
          cityId: updatedData.city?._id || '',
          cityName: updatedData.city?.name || ''
        });
        await AsyncStorage.setItem('@currentUser', JSON.stringify(updatedData));
        navigation.goBack();
      }
    } catch (err) {
      console.error('save profile error:', err);
    } finally {
      setSaving(false);
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
        <Text style={s.title}>Редактировать профиль</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={s.body}>
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Имя</Text>
          <TextInput
            style={s.input}
            placeholder="Введите имя"
            value={editForm.name}
            onChangeText={(t) => setEditForm({ ...editForm, name: t })}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Фамилия</Text>
          <TextInput
            style={s.input}
            placeholder="Введите фамилию"
            value={editForm.surname}
            onChangeText={(t) => setEditForm({ ...editForm, surname: t })}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Город</Text>
          <TouchableOpacity
            style={s.pickerButton}
            onPress={openCitySelector}
          >
            <Text style={s.pickerButtonText}>
              {editForm.cityName || 'Выбрать город'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>О себе</Text>
          <TextInput
            style={[s.input, s.textAreaInput]}
            placeholder="Расскажите о себе"
            value={editForm.about}
            onChangeText={(t) => setEditForm({ ...editForm, about: t })}
            multiline
            numberOfLines={5}
          />
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.button, s.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[s.buttonText, { color: '#666' }]}>Отменить</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.button, s.saveButton]}
          onPress={saveProfileChanges}
          disabled={saving}
        >
          <Text style={s.buttonText}>{saving ? 'Сохранение...' : 'Сохранить'}</Text>
        </TouchableOpacity>
      </View>
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
  body: { flex: 1, padding: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textAreaInput: { height: 120, paddingTop: 12, textAlignVertical: 'top' },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  pickerButtonText: { fontSize: 14, color: '#333', flex: 1 },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  cancelButton: { backgroundColor: '#f0f0f0' },
  saveButton: { backgroundColor: '#EC1B23' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
