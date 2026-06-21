import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../utils/apiClient';

export default function SelectCityScreen({ navigation, route }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const selectedCityId = route?.params?.selectedCityId || null;

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request('get', '/api/cities');
      if (res.data && res.data.success) {
        setCities(res.data.data || []);
      }
    } catch (err) {
      console.error('load cities', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = useMemo(() => {
    if (!searchText.trim()) return cities;
    const lower = searchText.toLowerCase();
    return cities.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      (c.region && c.region.toLowerCase().includes(lower))
    );
  }, [cities, searchText]);

  const handleSelectCity = (city) => {
    navigation.navigate('EditProfile', { selectedCity: city });
  };

  const renderCityItem = ({ item }) => {
    const isSelected = item._id === selectedCityId;
    return (
      <TouchableOpacity
        style={[s.cityItem, isSelected && s.cityItemSelected]}
        onPress={() => handleSelectCity(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[s.cityName, isSelected && { fontWeight: '700' }]}>
            {item.name}
          </Text>
          {item.region && (
            <Text style={s.cityRegion}>{item.region}</Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#EC1B23" />
        )}
      </TouchableOpacity>
    );
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
        <Text style={s.title}>Выбрать город</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Поиск города..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {filteredCities.length === 0 ? (
        <View style={s.emptyContainer}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={s.emptyText}>Города не найдены</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCities}
          keyExtractor={(item) => item._id}
          renderItem={renderCityItem}
          scrollEnabled={true}
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cityItemSelected: {
    backgroundColor: '#f9f9f9',
  },
  cityName: { fontSize: 16, fontWeight: '500', color: '#333' },
  cityRegion: { fontSize: 13, color: '#999', marginTop: 4 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
