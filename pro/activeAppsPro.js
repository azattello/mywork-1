import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export default function ActiveAppsPro({ navigation }) {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUserRaw = await AsyncStorage.getItem('@currentUser');
        if (!currentUserRaw) return setData([]);
        let userId = null;
        try {
          const parsed = JSON.parse(currentUserRaw);
          userId = parsed?.id || parsed?._id || parsed?.userId || parsed?.uid || null;
        } catch (e) {
          userId = currentUserRaw;
        }
        if (!userId) return setData([]);
        const res = await axios.get(`${API_URL}/api/applications/user/${userId}`);
        const appsData = (res.data && res.data.success) ? res.data.data : [];
        setData(appsData);
        setFilteredData(appsData);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setData([]);
        setFilteredData([]);
      }
    };

    fetchData();
  }, []);

  // Обновление данных в зависимости от поиска
  useEffect(() => {
    if (searchText === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => item.title.toLowerCase().includes(searchText.toLowerCase()));
      setFilteredData(filtered);
    }
  }, [searchText, data]);

  const handlePress = (item) => {
    // Переход на новый экран
    navigation.navigate('PostOpen', { item });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={item.active === true ? styles.cardApp : styles.cardAppOff} onPress={() => handlePress(item)}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.summ}>{item.summ} ₸</Text>
      </View>
      <Text style={styles.catalogName}>{item.info}</Text>
      <View style={styles.info}>
        <Text>8 откликов</Text>
        <View style={styles.eyeInfo}>
          <Ionicons size={15} name="eye-outline" />
          <Text style={styles.infoText}>75</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.searchContainer}>
        <Ionicons size={25} color={'#686868'} name="search-outline" />
        <TextInput
          style={styles.input}
          placeholder="Специалист или Услуга"
          value={searchText}
          onChangeText={setSearchText}
          keyboardType="default"
          autoCapitalize="none"
        />
         <TouchableOpacity>
        <Ionicons style={styles.iconFilter} size={25} color={'#686868'} name="funnel-outline"></Ionicons>
      </TouchableOpacity>
      </View>
     

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.area}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBEBEB',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  input: {
    height: 50,
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
  },
  cardApp: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: "#888",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 10,
  },
  cardAppOff: {
    display: 'none',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.4,
    borderBottomColor: '#DA7D81',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  summ: {
    fontWeight: '500',
    fontSize: 16,
  },
  catalogName: {
    paddingVertical: 15,
    fontSize: 16,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 10,
  },
  area: {
    marginBottom: 10,
  },
});
