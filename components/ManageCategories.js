import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';

export default function ManageCategories({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const api = apiClient;
      const [catsRes, userRes] = await Promise.all([
        api.request('get', '/api/categories/tree'),
        api.request('get', '/api/users/me').catch(() => ({ data: null })),
      ]);

      if (catsRes.data && catsRes.data.data) setCategories(catsRes.data.data);
      if (userRes.data && userRes.data.success) {
        const user = userRes.data.data;
        setSelected((user.categories || []).map(c => (typeof c === 'string' ? c : c._id)));
      } else {
        // fallback to local
        const cur = await AsyncStorage.getItem('@currentUser');
        if (cur) {
          try {
            const parsed = JSON.parse(cur);
            setSelected((parsed.categories || []).map(c => (typeof c === 'string' ? c : c._id)));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('ManageCategories load error', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const api = apiClient;
      const res = await api.request('put', '/api/users/me', { categories: selected });
      if (res.data && res.data.success) {
        const user = res.data.data;
        await AsyncStorage.setItem('@currentUser', JSON.stringify(user));
        const showToast = require('../utils/toast').default;
        showToast('Категории сохранены');
        navigation.goBack();
        return;
      }
      alert(res.data?.message || 'Ошибка при сохранении');
    } catch (err) {
      console.error('Save categories error', err.message || err);
      alert(err.response?.data?.message || err.message || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#EC1B23"/></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Управление категориями</Text>
        <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={save} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Сохранение...' : 'Сохранить'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listWrap}>
        {categories.map(cat => (
          <View key={cat._id} style={styles.catBlock}>
            <TouchableOpacity style={[styles.catItem, selected.includes(cat._id) && styles.active]} onPress={() => toggle(cat._id)}>
              <Text style={[styles.catText, selected.includes(cat._id) && styles.catTextActive]}>{cat.icon || ''} {cat.name}</Text>
            </TouchableOpacity>
            {cat.subcategories && cat.subcategories.length > 0 && (
              <View style={styles.subList}>
                {cat.subcategories.map(sub => (
                  <TouchableOpacity key={sub._id} style={[styles.subItem, selected.includes(sub._id) && styles.activeSub]} onPress={() => toggle(sub._id)}>
                    <Text style={[styles.subText, selected.includes(sub._id) && styles.subTextActive]}>{sub.icon || ''} {sub.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex:1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: '700' },
  saveButton: { backgroundColor: '#EC1B23', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.6 },
  listWrap: { padding: 16 },
  catBlock: { marginBottom: 12 },
  catItem: { padding: 12, backgroundColor: '#F5F6FA', borderRadius: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  active: { backgroundColor: '#FFF5F5', borderColor: '#EC1B23' },
  catText: { fontWeight: '600', fontSize: 15, color: '#222' },
  catTextActive: { color: '#EC1B23' },
  subList: { marginTop: 8, marginLeft: 12 },
  subItem: { padding: 8, backgroundColor: '#FAFAFA', borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: '#E8E8E8' },
  activeSub: { backgroundColor: '#FFF9F9', borderColor: '#EC1B23' },
  subText: { color: '#555' },
  subTextActive: { color: '#EC1B23', fontWeight: '600' },
});
