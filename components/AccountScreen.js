import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {BackHandler, Modal, View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDatabase, ref, set, onValue, get, } from "firebase/database";
import firebase from 'firebase/compat/app';



const firebaseConfig = {
	apiKey: "AIzaSyBCWFIu7g5tjQ7v6k24lh5Y4fY4Ue5miBM",
	authDomain: "yoyo-23ae8.firebaseapp.com",
	projectId: "yoyo-23ae8",
	storageBucket: "yoyo-23ae8.appspot.com",
	messagingSenderId: "870898352397",
	appId: "1:870898352397:web:80a12cd1e8eb6ff617b044"
};

firebase.initializeApp(firebaseConfig);
const db = getDatabase();


function LogoutModal({ isVisible, closeModal, onLogout }) {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="slide"
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>Вы уверены, что хотите выйти из аккаунта?</Text>
          <TouchableOpacity onPress={onLogout} style={styles.confirmButton}>
            <Text style={styles.buttonText}>Подтвердить</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
            <Text style={styles.buttonText}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function Account({navigation}) {
  // Логика для отображения Splash Screen
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storedRole, setStoredRole] = useState('');


  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const openLogoutModal = () => {
    setLogoutModalVisible(true);
  };

  const closeLogoutModal = () => {
    setLogoutModalVisible(false);
  };

  const handleLogout = async () => {
    // Дополнительные действия, если необходимо
    // Например, очистка AsyncStorage:
    await AsyncStorage.removeItem('@currentUser');
    // Закрытие модального окна
    BackHandler.exitApp();
    closeLogoutModal();
  };


  useEffect(() => {
	  loadData();
    
	}, []);

  const loadData = async () => {
	  try {
      const userID = await AsyncStorage.getItem('@currentUser');
      setStoredRole(userID || 'Нет данных в хранилище');

      const snapshot = await get(ref(db, `users/${userID}` ));
      console.log(snapshot);
      setName(snapshot.val().name)
      setSurname(snapshot.val().surname)
      setPhone(snapshot.val().phone)


    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
	  }

	};

  const ProfRef = ()=>{
    
    navigation.navigate('TabPro');
  
  }


  // const removeUserFromStorage = async () => {
  //   try {
  //     await AsyncStorage.removeItem('@currentUser');
  //     console.log('Item with key "user" removed from AsyncStorage');
  //   } catch (error) {
  //     console.error('Error removing item from AsyncStorage:', error);
  //   }
  // };
  


  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar
        backgroundColor="#fff"
      />
      <ScrollView>
          <View style={styles.accauntConatiner}>
            <View style={styles.infoContainer}>
              <View style={styles.avaContainer}>
                <Image 
                style={styles.ava}
                source={require('../assets/man.jpg')}
                />
              </View>
            <Text style={styles.name}>{surname + ' ' + name}</Text>

            </View>
            

              {/* <TouchableOpacity style={styles.geoContainer}>
                <Ionicons size={30} color={'#999696'} name="location-outline"></Ionicons>
                <Text style={styles.titleGeo}>Выбрать город</Text>
                <Ionicons size={30} color={'#999696'} name="chevron-down-outline"></Ionicons>
              </TouchableOpacity> */}

              <TouchableOpacity style={styles.geoContainer1}>
                <Text style={styles.titleGeo}>Настройки аккаунта</Text>
                <Ionicons size={30} color={'#999696'} name="settings-outline"></Ionicons>
              </TouchableOpacity>

              <TouchableOpacity style={styles.geoContainer1}>
                <Text style={styles.titleGeo}>Избранные специалисты</Text>
                <Ionicons size={30} color={'#999696'} name="heart-outline"></Ionicons>  
              </TouchableOpacity>

              <TouchableOpacity onPress={ProfRef} style={styles.geoContainer2}>
                <Text style={styles.titleGeo2}>Режим специалиста</Text>
                <Ionicons size={30} color={'#fff'} name="people-circle-outline"></Ionicons>
              </TouchableOpacity>

              <TouchableOpacity style={styles.geoContainer3}  onPress={openLogoutModal}>
                <Text style={styles.titleGeo3}>Выйти из аккаунта</Text>
                <Ionicons size={30} color={'#fff'}  name="exit-outline"></Ionicons>
              </TouchableOpacity>
              
              <LogoutModal
                isVisible={logoutModalVisible}
                closeModal={closeLogoutModal}
                onLogout={handleLogout}
              />
              
          </View>


      </ScrollView>
    
    
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
 
  accauntConatiner:{
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  
  infoContainer:{
    alignItems: 'center',
    backgroundColor: '#fff',
    width:'100%',
    marginTop: 25,
    paddingVertical:25,
    borderRadius: 20,

    shadowColor: "#999696",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 10,
  },
  avaContainer:{
    marginTop: 25,
    width: 170,
    height: 170,
    borderRadius: 200,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: "#999696",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 10,
  },

  ava:{
    width: 150,
    height: 150,
    borderRadius: 200,
    resizeMode: 'cover',
    
  },
  name:{
    fontSize: 20,
    fontWeight: '500',
    marginVertical: 40, 
    textAlign: 'center',
  },

  geoContainer:{
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
  geoContainer1:{
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
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  geoContainer2:{
    backgroundColor: '#B23439',
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
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  geoContainer3:{
    backgroundColor: '#000',
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
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  titleGeo3:{
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  titleGeo2:{
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  titleGeo:{
    fontSize: 16,
    fontWeight: '500',

  },
  area: {
    height: 50,
  },


  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#EC1B23',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },

});
