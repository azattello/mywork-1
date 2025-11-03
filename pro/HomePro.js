import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';



export default function HomePro({navigation}) {

  const AddRef = ()=>{
    // navigation.navigate('Feed');
    navigation.navigate('TabPro', { screen: 'Лента' });
    
  }

  const supportRef = ()=>{
    navigation.navigate('Служба поддержки');
  }

  const PostOpen = ()=>{
    // navigation.navigate('Служба поддержки');
    navigation.navigate('Заявка');
  }
  const Offer = ()=>{
    // navigation.navigate('Служба поддержки');
    navigation.navigate('Предложение');
  }
  const Message = ()=>{
    // navigation.navigate('Служба поддержки');
    navigation.navigate('Сообщение');
  }

  const Profile = ()=>{
    // navigation.navigate('Служба поддержки');
    navigation.navigate('Профиль');
  }
  const rating = ()=>{
    // navigation.navigate('Служба поддержки');
    navigation.navigate('Отзыв');
  }
  const viewUser = ()=>{
    // navigation.navigate('Служба поддержки');
    navigation.navigate('Исполнитель');
  }
  const ChatItem = ()=>{
    // navigation.navigate('Служба поддержки');
    navigation.navigate('Чат');
  }
  const filterRef = ()=>{
    navigation.navigate('Фильтр');
  }
  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar
        backgroundColor="#fff"
      />
      <ScrollView>

            <View style={styles.header}>

            

              <Text style={styles.title}>Чем вы занимаетесь?</Text>
              <View style={styles.inputContainer}>

                <Ionicons size={25} color={'#ABABAB'} name="search-outline"></Ionicons>

                  <TextInput
                  style={styles.input}
                  placeholder="Специалист или Услуга"
                  keyboardType="default"
                  autoCapitalize="none"
                  />
              </View>

            </View>

                <View style={styles.container}>

                  <TouchableOpacity style={styles.touchButton} onPress={AddRef}>
                    <Ionicons size={30} color={'#fff'} name="flash-outline"></Ionicons>
                    <Text style={styles.buttonText}>Лента заявок</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.line}>
                  <View style={styles.h1Container}>
                    <Text style={styles.h1}>Популярные услуги</Text>
                    <TouchableOpacity>
                      <Text style={styles.h2}>Все услуги</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity style={styles.card1}>
                      <Image style={styles.cardImg} source={require('../assets/service1.jpg')}/>
                      <Text style={styles.cardText}>Курьерские услуги</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service2.jpg')}/>
                      <Text style={styles.cardText}>Репетиторство</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service3.jpg')}/>
                      <Text style={styles.cardText}>Монтаж окон и дверей</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service4.jpg')}/>
                      <Text style={styles.cardText}>Клининг</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/santex.jpg')}/>
                      <Text style={styles.cardText}>Сантехника</Text>
                    </TouchableOpacity>


                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service5.jpeg')}/>
                      <Text style={styles.cardText}>Услуги няни</Text>
                    </TouchableOpacity>

                  </ScrollView>
                </View>

                <View style={styles.line}>
                  <View style={styles.h1Container}>
                    <Text style={styles.h1}>Дистанционные услуги</Text>
                    <TouchableOpacity>
                      <Text style={styles.h2}>Все услуги</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity style={styles.card1}>
                      <Image style={styles.cardImg} source={require('../assets/service6.jpg')}/>
                      <Text style={styles.cardText}>Видеомонтаж</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service7.jpg')}/>
                      <Text style={styles.cardText}>Создание дизайна</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service8.jpg')}/>
                      <Text style={styles.cardText}>Таргетированная реклама</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service9.jpg')}/>
                      <Text style={styles.cardText}>Услуги программистов</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service10.jpg')}/>
                      <Text style={styles.cardText}>Услуги маркетолога</Text>
                    </TouchableOpacity>


                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/service11.jpg')}/>
                      <Text style={styles.cardText}>Работа с текстом</Text>
                    </TouchableOpacity>

                  </ScrollView>
                </View>

                <View style={styles.line2}>
                  <View style={styles.h1Container}>
                    <Text style={styles.h1}>Топ специалистов</Text>
                    <TouchableOpacity>
                      <Text style={styles.h2}>Все специалисты</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity style={styles.card1}>
                      <Image style={styles.cardImg} source={require('../assets/santex.jpg')}/>
                      <Text style={styles.cardText}>Сантехника</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/santex.jpg')}/>
                      <Text style={styles.cardText}>Сантехника</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/santex.jpg')}/>
                      <Text style={styles.cardText}>Сантехника</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/santex.jpg')}/>
                      <Text style={styles.cardText}>Сантехника</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/santex.jpg')}/>
                      <Text style={styles.cardText}>Сантехника</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                      <Image style={styles.cardImg} source={require('../assets/santex.jpg')}/>
                      <Text style={styles.cardText}>Сантехника</Text>
                    </TouchableOpacity>

                  </ScrollView>
                </View>

                <View style={styles.gidContainer}>
                  <Text style={styles.h1}>Yoyo гид</Text>
                  <TouchableOpacity style={styles.collaps1}>
                    <Text style={styles.collapsText}>
                      Yoyo.kz платный?
                    </Text>
                    <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>
                    
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.collaps}>
                    <Text style={styles.collapsText}>
                      Как выбрать специалиста?
                    </Text>
                    <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>
                    
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.collaps}>
                    <Text style={styles.collapsText}>
                      Как оставить заявку?
                    </Text>
                    <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>
                    
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.collaps}>
                    <Text style={styles.collapsText}>
                    Как узнать опыт специалиста?
                    </Text>
                    <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>
                    
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.collaps}>
                    <Text style={styles.collapsText}>
                      Как оставить заявку?
                    </Text>
                    <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>
                    
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.collaps}>
                    <Text style={styles.collapsText}>
                      Как обработать отклики?
                    </Text>
                    <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>
                    
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.collaps}>
                    <Text style={styles.collapsText}>
                      Как изменить номера телефона?
                    </Text>
                    <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>
                    
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.collaps}>
                    <Text style={styles.collapsText}>
                      Как восстановить пароль?
                    </Text>
                    <Ionicons style={styles.collapsIcon} name="chevron-down-outline" size={20}></Ionicons>
                    
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.h2Container}>
                    <Text style={styles.collapsH2}>
                        Посмотреть все
                    </Text>
                  </TouchableOpacity>
                  



                </View>
                


                <View style={styles.footer}> 
                  <TouchableOpacity style={styles.supportContainer} onPress={supportRef}>
                      <Text style={styles.supportH2}>
                          Служба поддержки
                      </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.supportContainer} onPress={PostOpen}>
                      <Text style={styles.supportH2}>
                          Заявки
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportContainer} onPress={Offer}>
                      <Text style={styles.supportH2}>
                      Предложение
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportContainer} onPress={Message}>
                      <Text style={styles.supportH2}>
                      Сообщение
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportContainer} onPress={Profile}>
                      <Text style={styles.supportH2}>
                      Профиль
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportContainer} onPress={rating}>
                      <Text style={styles.supportH2}>
                      Отзыв
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportContainer} onPress={viewUser}>
                      <Text style={styles.supportH2}>
                      Просмотр профиля
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportContainer} onPress={ChatItem}>
                      <Text style={styles.supportH2}>
                      Чат
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.supportContainer} onPress={filterRef}>
                      <Text style={styles.supportH2}>
                      Фильтр
                      </Text>
                  </TouchableOpacity>
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
  header: {
    // paddingTop: 100, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    backgroundColor: '#fff',
    paddingBottom: 30,
    
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
    flex:1,
    alignItems: 'center',
    // backgroundColor: '#fff',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,


  },
  touchButton: {
    marginTop: 30,
    width: '100%',
    backgroundColor: '#B23439',
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
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
    fontWeight: '500',

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
    fontSize: 14,
    marginLeft: 30,
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
    marginTop: 40,
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
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,

  },
  collapsH2:{
    color: '#757575',


  },
  footer:{
    width: '100%',
    paddingHorizontal: 20,    
    marginBottom: 60,
    marginTop: 20,
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
    
  },
  supportH2: {
    color:'#EC1B23',
  },


 
});
