import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';



export default function CatalogSpecial({navigation}) {
  // Логика для отображения Splash Screen

  const view = ()=>{
    navigation.navigate('Исполнитель')
    
  }


  return (
    <SafeAreaView style={styles.wrapper}>
    <StatusBar
      backgroundColor="#fff"
    />
   

    <ScrollView>
            <View style={styles.gidContainer}>
                <Text style={styles.h1}>Каталог специалистов</Text>

                <View style={styles.main}>
          
                <TouchableOpacity style={styles.cardApp}>
                  <Image style={styles.image} source={require('../assets/bland.jpg')}/>
                  <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>Динара</Text>
                      <Text style={styles.status}>18 отзывов</Text>
                    </View>

                    <Text style={styles.task}>Няня</Text>
                    <View style={styles.info}>
                      <Text >Выполненных заказов (8)</Text>
                      
                    </View>
                    
                  </View>

                </TouchableOpacity>

                <TouchableOpacity style={styles.cardApp} onPress={view}>
                  <Image style={styles.image} source={require('../assets/man.jpg')}/>
                  <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>Алмаз</Text>
                      <Text style={styles.status}>(2) отзывов</Text>
                    </View>

                    
                    <Text style={styles.task}>IT специалист</Text>
                    <View style={styles.info}>
                      <Text >Выполненных заказов (2)</Text>
                      
                    </View>
                    
                  </View>

                </TouchableOpacity>
                
                <TouchableOpacity style={styles.cardApp}>
                  <Image style={styles.image} source={require('../assets/bland7.jpg')}/>
                  <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>Куаныш</Text>
                      <Text style={styles.status}>11 отзывов</Text>
                    </View>

                    
                    <Text style={styles.task}>Няня</Text>
                    <View style={styles.info}>
                      <Text >Выполненных заказов (8)</Text>
                      
                    </View>
                    
                  </View>

                </TouchableOpacity>

                <TouchableOpacity style={styles.cardApp}>
                  <Image style={styles.image} source={require('../assets/bland2.jpg')}/>
                  <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>Марина</Text>
                      <Text style={styles.status}>9 отзывов</Text>
                    </View>

                    
                    <Text style={styles.task}>Няня</Text>
                    <View style={styles.info}>
                      <Text >Выполненных заказов (8)</Text>
                      
                    </View>
                    
                  </View>

                </TouchableOpacity>

                <TouchableOpacity style={styles.cardApp}>
                  <Image style={styles.image} source={require('../assets/bland3.jpg')}/>
                  <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>Карина</Text>
                      <Text style={styles.status}>9 отзывов</Text>
                    </View>

                  
                    <Text style={styles.task}>Няня</Text>
                    <View style={styles.info}>
                      <Text >Выполненных заказов (8)</Text>
                      
                    </View>
                    
                  </View>

                </TouchableOpacity>

                <TouchableOpacity style={styles.cardApp}>
                  <Image style={styles.image} source={require('../assets/bland8.jpg')}/>
                  <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>Жаксылык</Text>
                      <Text style={styles.status}>7 отзывов</Text>
                    </View>

                    
                    <Text style={styles.task}>Няня</Text>
                    <View style={styles.info}>
                      <Text >Выполненных заказов (8)</Text>
                      
                    </View>
                    
                  </View>

                </TouchableOpacity>

                <TouchableOpacity style={styles.cardApp}>
                  <Image style={styles.image} source={require('../assets/bland4.jpg')}/>
                  <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>Айгул</Text>
                      <Text style={styles.status}>6 отзывов</Text>
                    </View>

                  
                    <Text style={styles.task}>Няня</Text>
                    <View style={styles.info}>
                      <Text >Выполненных заказов (8)</Text>
                      
                    </View>
                    
                  </View>

                </TouchableOpacity>

                <TouchableOpacity style={styles.cardApp}>
                  <Image style={styles.image} source={require('../assets/bland5.jpg')}/>
                  <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>Жасмин</Text>
                      <Text style={styles.status}>5 отзывов</Text>
                    </View>

                    
                    <Text style={styles.task}>Няня</Text>
                    <View style={styles.info}>
                      <Text >Выполненных заказов (8)</Text>
                      
                    </View>
                    
                  </View>

                </TouchableOpacity>
                  



                </View> 
             
              <View style={styles.area}></View>

            </View>

              <View style={styles.line}>
                <View style={styles.h1Container}>
                  <Text style={styles.h1}>Топ специалистов</Text>
                  <TouchableOpacity>
                    <Text style={styles.h2}>Все услуги</Text>
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
  paddingHorizontal: 10,

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
wrapper:{
  display: 'flex',
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
    paddingHorizontal: 10,
    paddingBottom: 50,

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

    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  info:{
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

  },
  eyeInfo:{
    flexDirection: 'row',
    alignItems: 'center',

  },
  infoText:{
    marginLeft: 5,
  },
  infoContainer:{
    paddingLeft: 15,


  },
  titleContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.2,
    borderBottomColor: '#DA7D81',
    paddingBottom: 10,
    width: '75%',
  },
  title:{
    fontSize: 20,
    textAlign: 'left',
    fontWeight: '500',
  },
  status:{
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 5,


  },
  task:{
    paddingVertical: 10,
    fontSize: 16,
    width: '100%',
  },




  image:{
    width: 70,
    height: 70,
    borderRadius: 15,
    borderWidth: 0.2,
    borderColor: '#444'
  },



});
