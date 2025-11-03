import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Mode from './mode';
import CommMode from './CommunicationMode';
import { sendData } from './sendData';


export default function Add({navigation}) {
  const [selectedCity, setSelectedCity] = useState('Выберите город');
  const [mode, setMod] = useState('');
  const [comm, setComm] = useState('');

  const [userID, setUserID] = useState('');

  const [title, setTitle] = useState('');
  const [summ, setSumm] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {

    loadCityFromStorage();
    loadItems();
  }, []); // Зависимость пуста, чтобы useEffect выполнялся только при монтировании компонента

  useFocusEffect(() => {
    loadCityFromStorage();
    loadItems();
    // Добавьте здесь код, который нужно выполнить при каждом фокусе
  });

  const loadItems = async () => {
    try {
      const storedMod = await AsyncStorage.getItem('@mode');
      if (storedMod) {
        setMod(storedMod);
      }
      const storedComm = await AsyncStorage.getItem('@comm');
      if (storedComm) {
        setComm(storedComm);
      }
    } catch (error) {
      console.error('Ошибка при чтении из AsyncStorage:', error);
    }
    const currentUser = await AsyncStorage.getItem('@currentUser');
    if (currentUser) {
      try {
        const parsed = JSON.parse(currentUser);
        // try common id fields
        const id = parsed.id || parsed._id || parsed.userId || parsed.uid || parsed;
        setUserID(id);
      } catch (e) {
        // if not JSON, just use the raw value
        setUserID(currentUser);
      }
    }
  };
  
  const handleSendData = () => {
    // Валидация
    if (!userID) {
      alert('Пользователь не найден. Пожалуйста, войдите в систему.');
      return;
    }
    if (!title || title.trim().length < 3) {
      alert('Введите корректный заголовок (минимум 3 символа)');
      return;
    }

    // Ваша логика для получения данных
    const dataToSend = {
      city: selectedCity,
      mode: mode,
      comm: comm,
      title: title,
      summ: summ,
      info: info,
      active: true,
      userID: userID,

      // ... другие данные
    };

    sendData(dataToSend, navigation);
  };
  

  
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




  console.log(selectedCity)

  const cityChois = ()=>{
    navigation.navigate('Ваш город');
  }

  return (
    <SafeAreaView style={styles.wrapper}>
    <StatusBar
      backgroundColor="#fff"
      name={'safd'}
    />
    
    <View style={styles.header}>
     
    </View>

    <ScrollView>
              

              <View style={styles.gidContainer}>
              <TouchableOpacity style={styles.geoContainer} onPress={cityChois}>
                  <Ionicons size={30} color={'#999696'} name="location-outline"></Ionicons>
                  <Text style={styles.titleGeo}>{selectedCity}</Text>
                  <Ionicons size={30} color={'#999696'} name="chevron-forward-outline"></Ionicons>
                </TouchableOpacity>
              
                <Mode/>
                <CommMode/>

                {/* <Text style={styles.h1}>Выберите категорию</Text>
                <TouchableOpacity style={styles.collaps1}>
                  <Text style={styles.collapsText}>
                    Репетиторы
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>  
                </TouchableOpacity> */}

                <Text style={styles.titleH1}>Заголовок зявки</Text>
                <TextInput
                  editable
                  multiline
                  maxLength={70}
                  placeholder='Заголовок заявки'
                  style={styles.H1Input}
                  onChangeText={(text) => setTitle(text)}
                />

              <Text style={styles.titleH1}>Сколько вы готовы заплатить?</Text>
                <View style={styles.SummContainer}>
                  <TextInput
                    editable
                    multiline
                    maxLength={70}
                    keyboardType="number-pad"
                    placeholder='0'
                    style={styles.SummInput}
                    onChangeText={(text) => setSumm(text)}
                  />
                  <Text style={styles.summText}>ТГ</Text>
                </View>

                <Text style={styles.titleH1}>Опишите задачу</Text>
                <TextInput
                  editable
                  multiline
                  numberOfLines={5}
                  maxLength={1000}
                  placeholder='Описание заявки...'
                  style={styles.textArea}
                  onChangeText={(text) => setInfo(text)}
                />
                  <View style={styles.h2Container}>
                    <Text style={styles.collapsH2}>
                        Максимум 1000 символов
                    </Text>
                  </View>

                
                
              
               


              </View>
             
              {/* <View style={styles.area}></View> */}
              
          
          
    </ScrollView>
    <View style={styles.footer}> 
      <TouchableOpacity style={styles.supportContainer} onPress={handleSendData}>
          <Text style={styles.supportH2}>
            Опубликовать заявку
          </Text>
      </TouchableOpacity>
    </View>
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
  marginTop: 35, 
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

container: {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  // backgroundColor: '#fff',
  width: '100%',
  paddingHorizontal: 40,
  paddingVertical: 20,
  paddingTop: 30,
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
touchButton: {
  marginTop: 30,
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: 14,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 30,

  shadowColor: "#999696",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.05,
  shadowRadius: 1,
  elevation: 10,
},
buttonText: {
  color: '#EC1B23',
  fontSize: 16,
  marginLeft: 5,
},
line: {
  marginTop: 40,
  
},
h1Container:{
  display: 'flex',
  flexDirection: "row",
  alignItems: 'center',
  justifyContent: 'space-between',

},
h1: {
  fontSize: 16,
  marginLeft: 20,
},
h2: {
  marginRight: 30,
  color: '#808080',

},
card1: {
  marginRight: 20,
  marginTop: 10,
  marginLeft: 20,
  marginBottom: 20,
  backgroundColor: '#fff',
  padding: 5,
  paddingBottom: 20,
  borderRadius:16,

  shadowColor: "#999696",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.05,
  shadowRadius: 1,
  elevation: 10,


},
card: {
  marginRight: 20,
  marginTop: 10,
  marginBottom: 20,
  backgroundColor: '#fff',
  padding: 5,
  paddingBottom: 20,
  borderRadius:16,

  shadowColor: "#999696",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.05,
  shadowRadius: 1,
  elevation: 10,


},
cardImg: {
  width: 200,
  height: 130,
  borderRadius: 5,
  borderTopLeftRadius: 13,
  borderTopRightRadius: 13,
},
cardText: {
  marginTop: 15,
  paddingLeft: 10,
  fontSize: 14,
  // fontWeight: '500',
  textAlign: 'left',
},

line2: {
  marginTop: 60,

},
gidContainer:{
  marginTop: 30,
  marginBottom: 10,
  paddingHorizontal: 20,

},
collaps1:{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 20,
  backgroundColor: '#fff',
  paddingVertical: 20,
  paddingHorizontal: 40,
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


collaps:{
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 10,
  backgroundColor: '#fff',
  paddingVertical: 20,
  paddingHorizontal: 40,
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

collapsText:{
  fontSize: 14,
},
collapsIcon:{
  marginLeft: 10,

},
h2Container:{
  width: '100%',
  marginTop: 20,
  marginBottom: 20,
  flexDirection: 'row',
  justifyContent: 'flex-end',
  paddingRight: 15,

},
collapsH2:{
  color: '#757575',


},

titleH1:{
  fontSize: 16,
  marginLeft: 20,
  marginTop: 40,
  marginTop: 20,
  
},
  H1Input:{
    backgroundColor: '#fff',
    marginTop: 20,

    borderRadius: 10,

    shadowColor: "#0000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 10,

    fontSize: 16,
    fontWeight: '500',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,

    
  },
  SummContainer:{
    backgroundColor: '#fff',
    marginTop: 20,

    borderRadius: 10,

    shadowColor: "#0000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 10,

    fontSize: 16,
    fontWeight: '500',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,

  },
  SummInput:{
    fontSize: 16,
    fontWeight: '500',
    width: '70%',
    marginHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff'

  },
  summText:{
    fontWeight: '500',

  },
  textArea:{
    backgroundColor: '#fff',
    marginTop: 20,

    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,


    shadowColor: "#0000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 10,

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

  footer:{
    width: '100%',
    paddingHorizontal: 20,    
    marginBottom: 30,
  },
  supportContainer:{
    marginTop: 15,
    width: '100%',
    height: 60,
    borderWidth: 1,
    borderRadius: 14,
    borderColor: '#EC1B23',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B23439',

    shadowColor: "#999696",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 5,
    
  },
  supportH2: {
    color:'#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  area: {
    height: 50,
  }


});
