import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {Modal, View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, BackHandler } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';


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


const reviews = [
  {
    name: 'Имя',
    date: '1 октябрь 2025',
    service: 'Landing page',
    rating: 5,
    review: 'Текст отзыва',
  },
  {
    name: 'Имя 2',
    date: '1 октябрь 2025',
    service: 'Landing page',
    rating: 5,
    review: 'Текст отзыва',
  },
];

const ReviewCard = ({ review }) => {
  return (
    <ScrollView  style={styles.reviewCard}>
      <Text style={styles.reviewName}>{review.name}</Text>
      <Text style={styles.reviewDate}>{review.date}</Text>
      <Text style={styles.reviewService}>{review.service}</Text>
      <View style={styles.reviewRating}>
        {Array.from({ length: review.rating }).map((_, index) => (
          <Text key={index}>⭐</Text>
        ))}
      </View>
      <Text style={styles.reviewText}>{review.review}</Text>
    </ScrollView>
  );
};


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


// ------------------ Edit Profile Modal ------------------
function EditProfileModal({ visible, onClose, userData, onSave }) {
  const [name, setName] = useState(userData.name || '');
  const [surname, setSurname] = useState(userData.surname || '');
  const [city, setCity] = useState(userData.city || '');
  const [about, setAbout] = useState(userData.about || '');

  useEffect(() => {
    setName(userData.name || '');
    setSurname(userData.surname || '');
    setCity(userData.city || '');
    setAbout(userData.about || '');
  }, [userData]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Редактировать профиль</Text>

          <TextInput
            style={styles.input}
            placeholder="Имя"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Фамилия"
            placeholderTextColor="#999"
            value={surname}
            onChangeText={setSurname}
          />
        
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="О себе"
            placeholderTextColor="#999"
            value={about}
            onChangeText={setAbout}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => onSave({ name, surname, city, about })}
            >
              <Text style={styles.buttonText}>Сохранить</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: '#444' }]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


export default function AccountPro({ navigation }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [about, setAbout] = useState('');
  const [city, setCity] = useState('');
  const [storedID, setStoredID] = useState('');

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const openLogoutModal = () => setLogoutModalVisible(true);
  const closeLogoutModal = () => setLogoutModalVisible(false);

  const openEditModal = () => setEditModalVisible(true);
  const closeEditModal = () => setEditModalVisible(false);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@currentUser');
    BackHandler.exitApp();
    closeLogoutModal();
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const userID = await AsyncStorage.getItem('@currentUser');
      if (!userID) return;

      setStoredID(userID);
      const snapshot = await get(ref(db, `users/${userID}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setName(data.name || '');
        setSurname(data.surname || '');
        setCity(data.city || '');
        setAbout(data.about || '');
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleSaveProfile = async (updatedData) => {
    try {
      if (!storedID) return;

      await set(ref(db, `users/${storedID}`), {
        name: updatedData.name,
        surname: updatedData.surname,
        city: updatedData.city,
        about: updatedData.about,
      });

      setName(updatedData.name);
      setSurname(updatedData.surname);
      setCity(updatedData.city);
      setAbout(updatedData.about);

      closeEditModal();
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
    }
  };

  const ProfRef = () => {
    navigation.navigate('TabNav');
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar backgroundColor="#fff" />
      <ScrollView>
        <View style={styles.accauntConatiner}>
          {/* --- Профиль --- */}
          <View style={styles.infoContainer}>
            <View style={styles.avaContainer}>
              <Image
                style={styles.ava}
                source={require('../assets/man.jpg')}
              />
            </View>
            <Text style={styles.name}>Азат Абдыкали</Text>
            <Text style={styles.praise}>Не верефицирован</Text>

            {/* Кнопка редактировать */}
            <TouchableOpacity
              style={{
                marginTop: 15,
                backgroundColor: '#006605ff',
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
              onPress={openEditModal}
            >
              <Text style={{ color: '#fff', fontWeight: '500' }}>
                Редактировать профиль
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- Город --- */}
          <TouchableOpacity style={styles.geoContainer} onPress={() => navigation.navigate('Ваш город')}>
            <Ionicons size={30} color={'#999696'} name="location-outline" />
            <Text style={styles.titleGeo}>{city || 'Выберите город'}</Text>
            <Ionicons size={30} color={'#999696'} name="chevron-forward-outline" />
          </TouchableOpacity>

          {/* --- О себе --- */}
          <View style={styles.geoContainer4}>
            <Text style={styles.titleGeo4}>О себе</Text>
            <Text style={styles.pText}>{about || 'Информация не заполнена'}</Text>
          </View>

          {/* --- Остальные пункты --- */}
          <TouchableOpacity style={styles.geoContainer1}>
            <Text style={styles.titleGeo}>Мои отзывы</Text>
            <Ionicons size={30} color={'#999696'} name="happy-outline" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.geoContainer1}>
            <Text style={styles.titleGeo}>Мои работы</Text>
            <Ionicons size={30} color={'#999696'} name="folder-open-outline" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.geoContainer1}>
            <Text style={styles.titleGeo}>Настройки аккаунта</Text>
            <Ionicons size={30} color={'#999696'} name="settings-outline" />
          </TouchableOpacity>

          {/* --- Отзывы --- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.containerReview}
          >
            {reviews.map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </ScrollView>

          {/* --- Кнопки режима и выхода --- */}
          <TouchableOpacity onPress={ProfRef} style={styles.geoContainer2}>
            <Text style={styles.titleGeo2}>Режим клиента</Text>
            <Ionicons size={30} color={'#fff'} name="people-circle-outline" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.geoContainer3} onPress={openLogoutModal}>
            <Text style={styles.titleGeo3}>Выйти из аккаунта</Text>
            <Ionicons size={30} color={'#fff'} name="exit-outline" />
          </TouchableOpacity>

          {/* --- Модалки --- */}
          <LogoutModal
            isVisible={logoutModalVisible}
            closeModal={closeLogoutModal}
            onLogout={handleLogout}
          />

          <EditProfileModal
            visible={editModalVisible}
            onClose={closeEditModal}
            userData={{ name, surname, city, about }}
            onSave={handleSaveProfile}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  praise: {
    marginTop: 5,
    fontSize: 14,
    color: '#cc822eff',
    fontWeight: 'bold',
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
    marginTop: 40, 
    textAlign: 'center',
  },
  proText:{
    marginVertical: 15, 
    fontSize: 18,
    fontWeight: '500',
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
  geoContainer4:{
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

    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  titleGeo4:{
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'left',
  },
  pText:{
    marginTop: 10,
    width: '100%',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#222',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2b8a3e',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#e5e5e5',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },



  containerReview: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding:5,
    marginTop: 15,
  },

  reviewCard: {
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    width: 300,
    marginRight: 10,
  },
  reviewName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewDate: {
    color: '#888',
    fontSize: 14,
  },
  reviewService: {
    color: '#333',
    fontSize: 14,
  },
  reviewRating: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileVerified: {
    color: '#4CAF50',
    marginTop: 5,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  profileRating: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileReviews: {
    color: '#888',
  },
  profilePraise: {
    color: '#4CAF50',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContent: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
});
