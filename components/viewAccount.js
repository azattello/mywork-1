import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {Modal, View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, BackHandler } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';





const reviews = [
  {
    name: 'Риза',
    date: '1 апреля 2024',
    service: 'Landing page',
    rating: 5,
    review: 'Работу выполнил на 1000% Рада, что нам попался этот исполнитель и взялся за нашу работу. Спасибо что выручили в нужный момент😊🙏. Изначально , за работу взялся другой специалист и все было ок, пока он не пропал, а дедлайны горели. К счастью, Алмаз все быстро и качественно выполнил когда мы обратились к нему за просьбой и попросили сделать быстро 👍 Советую от всей души)',
  },
  {
    name: 'Дамир',
    date: '30 декабря 2023',
    service: 'Оформление презентаций • Видеопрезентации',
    rating: 5,
    review: 'Быстро, качественно! Молодец!',
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


export default function ViewAccount({navigation}) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [storedID, setStoredID] = useState('');
  const [selectedCity, setSelectedCity] = useState('Выберите город');

  
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
    loadCityFromStorage();
    
	}, []);
  useFocusEffect(() => {
    loadData();
    loadCityFromStorage();
    // Добавьте здесь код, который нужно выполнить при каждом фокусе
  });

  
  const loadCityFromStorage = async () => {
    try {
      const storedCity = await AsyncStorage.getItem('@city');
      if (storedCity) {
        setSelectedCity(storedCity);
      }
    } catch (error) {
      console.error('Ошибка при чтении из AsyncStorage:', error);
    }
  };

  
  const cityChois = ()=>{
    navigation.navigate('Ваш город');
  }


  const loadData = async () => {
    try {
      const current = await AsyncStorage.getItem('@currentUser');
      if (current) {
        try {
          const parsed = JSON.parse(current);
          setStoredID(parsed._id || parsed.id || 'Нет данных в хранилище');
          setName(parsed.name || '');
          setSurname(parsed.surname || '');
          return;
        } catch (e) { /* continue */ }
      }

      // Fallback: try API if token exists
      const token = await AsyncStorage.getItem('@accessToken');
      if (token) {
        try {
          const apiClient = require('../utils/apiClient').default;
          const res = await apiClient.request('get', '/api/users/me');
          if (res.data && res.data.success) {
            const user = res.data.data;
            setName(user.name || '');
            setSurname(user.surname || '');
            setStoredID(user._id || user.id || '');
            await AsyncStorage.setItem('@currentUser', JSON.stringify(user));
            return;
          }
        } catch (err) {
          console.warn('API profile load failed:', err.message);
        }
      }

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }

  };
  console.log(storedID);
  
  const ProfRef = ()=>{
    navigation.navigate('Сообщение');
    
  }

  
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
            <Text style={styles.proText}>IT специалист</Text>
              
            </View>

           
            <TouchableOpacity style={styles.geoContainer1}>
                {/* <Text style={styles.titleGeo}>Мои отзывы</Text> */}
                <Text style={styles.titleGeo}>(2) отзывов</Text>
                <Text style={styles.titleGeo}>5,0 ⭐</Text>
              </TouchableOpacity>
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.containerReview}>
                {reviews.map((review, index) => (
                  <ReviewCard key={index} review={review} />
                ))}
              </ScrollView>


            
              <TouchableOpacity style={styles.geoContainer} onPress={cityChois}>
                <Text style={styles.titleGeo}>{selectedCity}</Text>
              </TouchableOpacity>
            
              <View style={styles.geoContainer4}>
                <Text style={styles.titleGeo4}>О себе</Text>
                <Text style={styles.pText}>IT специалист с опытом разработке IT продуктов. Готов к новым задачам и постоянному росту.</Text>
              </View>
 

              {/* <TouchableOpacity style={styles.geoContainer1}>
                <Text style={styles.titleGeo}>Избранные категории</Text>
                <Ionicons size={30} color={'#999696'} name="heart-outline"></Ionicons>  
              </TouchableOpacity>
               */}
      
              <TouchableOpacity onPress={ProfRef} style={styles.geoContainer2}>
                <Text style={styles.titleGeo2}>Предложить заказ</Text>
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
    justifyContent: 'center',
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
    justifyContent: 'center',
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
