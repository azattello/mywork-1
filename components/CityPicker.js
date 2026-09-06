import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

const API_ENDPOINT = `${API_URL}/api`;

/**
 * CityPicker - компонент для выбора города
 * 
 * Props:
 * - onSelect: функция, вызываемая при выборе города
 * - selectedCityId: ID выбранного города (опционально)
 */
const CityPicker = ({ onSelect, selectedCityId }) => {
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINT}/cities`);
      if (response.data.success) {
        const data = response.data.data;
        setCities(data);
        setFilteredCities(data);

        // Если уже выбран город
        if (selectedCityId) {
          const selected = data.find(c => c._id === selectedCityId);
          if (selected) {
            setSelectedCity(selected);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredCities(cities);
    } else {
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(text.toLowerCase()) ||
        (city.region && city.region.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredCities(filtered);
    }
  };

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    onSelect(city._id);
    setModalVisible(false);
    setSearchText('');
  };

  const renderCityItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => handleSelectCity(item)}
    >
      <Text style={styles.cityName}>{item.name}</Text>
      {item.region && <Text style={styles.cityRegion}>{item.region}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.pickerLabel}>Город</Text>
        <Text style={styles.pickerValue}>
          {selectedCity ? selectedCity.name : 'Выберите город'}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSearchText('');
              }}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Выберите город</Text>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск города..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCities}
            renderItem={renderCityItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Города не найдены</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cityItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cityRegion: {
    fontSize: 13,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default CityPicker;
