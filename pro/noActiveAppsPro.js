import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import AppsList from './appsList';

import axios from 'axios/dist/axios.min.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';


export default function NoActiveAppsPro({navigation}) {

  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUserRaw = await AsyncStorage.getItem('@currentUser');
        if (!currentUserRaw) return setData([]);
        let userId = null;
        try { const parsed = JSON.parse(currentUserRaw); userId = parsed?.id || parsed?._id || parsed?.userId || parsed?.uid || null; } catch (e) { userId = currentUserRaw; }
        if (!userId) return setData([]);
        const res = await axios.get(`${API_URL}/api/applications/user/${userId}`);
        if (res.data && res.data.success) setData(res.data.data || []);
        else setData([]);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setData([]);
      }
    };

    fetchData();
  }, []);

  const renderItem = ({ item }) => (
    
    <TouchableOpacity style={item.active === false ?  styles.cardApp : styles.cardAppOff }>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.summ}>{item.summ} ₸</Text>
      </View>
      <Text style={styles.catalogName}>
      {item.info}
      </Text>
      <View style={styles.info}>
        <Text >8 откликов</Text>
        <View style={styles.eyeInfo}>
          <Ionicons size={15} name="eye-outline"></Ionicons>
          <Text style={styles.infoText}>75</Text>
        </View>
      </View>
      </TouchableOpacity>
  );

  

  return (
    

        <View style={styles.main}>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.area}
            showsVerticalScrollIndicator={false}
          />


        </View> 

);
};

const styles = StyleSheet.create({
wrapper:{
  display: 'flex',
  width: '100%',
  flex: 1,
  flexDirection: 'column',
  backgroundColor: '#F2F2F2'

},
header: {
  backgroundColor: '#fff',
},


container: {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fff',
  width: '100%',
  paddingHorizontal: 40,
  paddingVertical: 20,

  borderBottomWidth: 0.2,
  borderColor: '#A7A7A7'
},
choice1:{
  height: 50,
  width: '45%',
  marginLeft: 5,
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,

  shadowColor: "#999696",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.05,
  shadowRadius: 1,
  elevation: 10,
},
choiceText:{
  color: '#fff',
},
choice2:{
  height: 50,
  width: '45%',
  marginRight: 5,
  backgroundColor: '#B23439',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,


  shadowColor: "#999696",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.05,
  shadowRadius: 1,
  elevation: 10,
  },


  main:{
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 20,

  },

  cardApp:{
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    
    shadowColor: "#888",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 10,

    flexDirection: 'column',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardAppOff:{
    display: 'none',
  },
  titleContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.4,
    borderBottomColor: '#DA7D81',
    paddingBottom: 10,

  },
  title:{
    fontSize: 18,
    textAlign: 'left',
    fontWeight: '500',
  },
  summ:{
    fontWeight: '500',
    fontSize: 16,

  },
  catalogName:{
    paddingVertical: 15,
    fontSize: 16,
  },
  info:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

  },
  eyeInfo:{
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  infoText:{
    marginLeft: 10,
  },
  area: {
    marginBottom: 10,
  }


});
