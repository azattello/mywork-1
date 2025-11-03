import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';



export default function CatalogServicePro({navigation}) {
  // Логика для отображения Splash Screen

  const AddRef = ()=>{
    navigation.navigate('Add')
    
  }
 

  return (
    <SafeAreaView style={styles.wrapper}>
    <StatusBar
      backgroundColor="#fff"
    />
   

    <ScrollView>
    <View style={styles.gidContainer}>
                <Text style={styles.h1}>Каталог услуг</Text>
                
               
                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Бытовой ремонт
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>
                

                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Строительство и отделка
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>

                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Помощь по дому
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>
                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                  Грузоперевозки и доставка
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>
                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Деловые услуги
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>
                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    IT и фрилансеры
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>
                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Автоуслуги
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>
                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Услуги здоровья
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                </TouchableOpacity>

                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Услуги спецтехники
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>

                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Репетиторство
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>

                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                    Спортивные тренеры
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>

                <TouchableOpacity style={styles.collaps}>
                  <Text style={styles.collapsText}>
                  Услуги красоты
                  </Text>
                  <Ionicons style={styles.collapsIcon} name="chevron-forward-outline" size={20}></Ionicons>
                  
                </TouchableOpacity>
                <TouchableOpacity style={styles.h2Container}>
                  <Text style={styles.collapsH2}>
                      Посмотреть все
                  </Text>
                </TouchableOpacity>
                



              </View>
              <View style={styles.line}>
                <View style={styles.h1Container}>
                  <Text style={styles.h1}>Популярные услуги</Text>
                  
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

container: {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  // backgroundColor: '#fff',
  width: '100%',
  paddingHorizontal: 40,
  paddingVertical: 20,
},
choice1:{
  height: 50,
  width: '45%',
  marginLeft: 5,
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
choiceText:{
  color: '#fff',
},
choice2:{
  height: 50,
  width: '45%',
  marginRight: 5,
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
  marginTop: 10,
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
