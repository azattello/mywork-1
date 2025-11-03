import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Collapsible from 'react-native-collapsible';

export default function CommMode({navigation}) {
    const [section1, setSection1] = useState(false);
    const [sectionModComm, setSectionModComm] = useState('Написать сообщение')


    // useEffect(() => {
    //   handleAsync(sectionModComm);
    // }, []); // Зависимость пуста, чтобы useEffect выполнялся только при монтировании компонента



    const mod1 = () => {
        setSectionModComm('Написать сообщение');
        toggleSection('section1')
        handleAsync('Написать сообщение')
        
    }
    const mod2 = () => {
        setSectionModComm('Позвонить')
        toggleSection('section1')
        handleAsync('Позвонить')


    }
    const mod3 = () => {
        setSectionModComm("Whats'App")
        toggleSection('section1')
        handleAsync("Whats'App")

        
    }

    const handleAsync = async (text) => {
        try {
            await AsyncStorage.setItem('@comm', text);
            console.log('Текст сохранен в AsyncStorage:', text);
          } catch (error) {
            console.error('Ошибка при сохранении текста:', error);
          }
    }
    



    const toggleSection = (section) => {
        switch (section) {
          case 'section1':
            setSection1(!section1);
            break;
          default:
            break;
        }
      };
  return (
            <View>
                <Text style={styles.titleContact}>Способ связи</Text>
                <TouchableOpacity style={styles.contactContainer} onPress={() => toggleSection('section1')}>
                  <Ionicons size={30} color={'#999696'} name="chatbubbles-outline"></Ionicons>
                  <Text style={styles.titleGeo}>{sectionModComm}</Text>
                  <Ionicons size={30} color={'#999696'} name={section1 === false ? "chevron-forward-outline" : "chevron-down-outline" }></Ionicons>
                </TouchableOpacity>

                <Collapsible collapsed={!section1}>
                    <View style={styles.commOptionWrapper}>
                        <TouchableOpacity style={styles.commOption} onPress={mod1}> 
                            <Text>Написать сообщение</Text>
                            <Ionicons size={25} color={'#999696'} name="chatbubbles-outline"></Ionicons>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commOption} onPress={mod2}> 
                            <Text>Позвонить</Text>
                            <Ionicons size={25} color={'#999696'} name="call-outline"></Ionicons>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commOption} onPress={mod3}> 
                            <Text>Whats'App</Text>
                            <Ionicons size={25} color={'#999696'} name="logo-whatsapp"></Ionicons>
                        </TouchableOpacity>
                  
                    </View>
                </Collapsible>
              </View>
             

);
};

const styles = StyleSheet.create({

  titleGeo:{
    fontSize: 16,
    fontWeight: '500',

  },
  contactContainer:{
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,

  
    shadowColor: "#999696",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  titleContact:{
    fontSize: 16,
    marginTop: 40,
    marginLeft: 20,
  },
  commOptionWrapper:{
    marginTop: 10,
  },
  commOption:{
   paddingHorizontal: 20,
   paddingVertical: 20,
   backgroundColor: "#fff", 
   borderRadius: 10,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

});
