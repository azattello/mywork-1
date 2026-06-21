import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';

export default function Cities({navigation}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      const res = await apiClient.request('get', '/api/cities');
      if (res.data && res.data.success) {
        setCities(res.data.data || []);
        setFilteredData(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    const filtered = cities.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
    setSearchQuery(query);
  };

  const handleCityPress = async (cityId, cityName) => {
    try {
      // Save both the ID and name for reference
      await AsyncStorage.setItem('@city', cityId);
      await AsyncStorage.setItem('@cityName', cityName);
      console.log('City saved:', cityId, cityName);
    } catch (error) {
      console.error('Error saving city:', error);
    }
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
    <StatusBar backgroundColor="#fff" />
   
    <View style={styles.header}>
      <View style={styles.inputContainer}>
        <Ionicons size={25} color={'#ABABAB'} name="search-outline"></Ionicons>
        <TextInput
          style={styles.input}
          placeholder="Поиск городов"
          keyboardType="default"
          autoCapitalize="none"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
    </View>
              
    <FlatList
      data={filteredData}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.choiceCityEl} onPress={() => handleCityPress(item._id, item.name)} >
          <Text style={styles.choiceCityElText}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
    wrapper:{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#F2F2F2'
      
      },
      header: {
        paddingTop: 10, 
        paddingBottom: 15, 
        paddingHorizontal: 20, 
        backgroundColor: '#fff',
        
      },
      
      title:{
        marginTop: 50, 
        fontSize: 22,
        textAlign: 'center',
        fontWeight: '500',
      },
      
      inputContainer:{
        height: 50, 
        width: '100%',
        backgroundColor: '#EBEBEB',
        paddingHorizontal: 15,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
      
       
      },
      input: {
        // backgroundColor: '#000',
        height: '100%',
        width: 260,
        fontSize: 14,
        marginLeft: 10,
      
      },
      choiceCityEl:{
        paddingHorizontal: 30,
        paddingVertical: 25,
        backgroundColor: '#fff',
        borderColor: '#EBEBEB',
        borderTopWidth: 1,
        borderBottomWidth: 1,


      },
      choiceCityEl2:{
        paddingHorizontal: 30,
        paddingVertical: 25,
        backgroundColor: '#fff',
        borderColor: '#D0D0D0',
        borderBottomWidth: 1,
      },
      choiceCityElText:{
        fontSize: 16,

      },

});
