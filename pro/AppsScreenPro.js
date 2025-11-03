import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import {View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function AppsPro({navigation}) {
  // Логика для отображения Splash Screen

  const AddRef = ()=>{
    navigation.navigate('Add')
    
  }

  const [selectedIndex, setIndex] = React.useState(0);


  return (
    <SafeAreaView style={styles.wrapper}>
    <StatusBar
      backgroundColor="#fff"
      name={'safd'}
    />
    
    <View style={styles.container}>
        <TouchableOpacity style={styles.choice2}>
          <Text style={styles.choiceText}>Открытые</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.choice1}>
          <Text>Отказы</Text>
        </TouchableOpacity>
    </View>

    <ScrollView>
        <View style={styles.main}>
          
          <TouchableOpacity style={styles.cardApp}>
            <Image style={styles.image} source={require('../assets/bland.jpg')}/>
            <View style={styles.infoContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Динара</Text>
                <Text style={styles.status}>посмотрено</Text>
              </View>

              <Text style={styles.task}>Нужно разработать приложение</Text>
              <View style={styles.info}>
                <Text >8 откликнулись</Text>
                <View style={styles.eyeInfo}>
                  <Ionicons size={15} name="eye-outline"></Ionicons>
                  <Text style={styles.infoText}>75</Text>
                </View>
              </View>
              
            </View>

          </TouchableOpacity>

          <TouchableOpacity style={styles.cardApp}>
            <Image style={styles.image} source={require('../assets/bland6.jpg')}/>
            <View style={styles.infoContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Аскар</Text>
                <Text style={styles.status}>посмотрено</Text>
              </View>

              <Text style={styles.task}>Нужно разработать приложение</Text>
              <View style={styles.info}>
                <Text >8 откликнулись</Text>
                <View style={styles.eyeInfo}>
                  <Ionicons size={15} name="eye-outline"></Ionicons>
                  <Text style={styles.infoText}>75</Text>
                </View>
              </View>
              
            </View>

          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cardApp}>
            <Image style={styles.image} source={require('../assets/bland7.jpg')}/>
            <View style={styles.infoContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Куаныш</Text>
                <Text style={styles.status}>посмотрено</Text>
              </View>

              <Text style={styles.task}>Нужно разработать приложение</Text>
              <View style={styles.info}>
                <Text >8 откликнулись</Text>
                <View style={styles.eyeInfo}>
                  <Ionicons size={15} name="eye-outline"></Ionicons>
                  <Text style={styles.infoText}>75</Text>
                </View>
              </View>
              
            </View>

          </TouchableOpacity>

          <TouchableOpacity style={styles.cardApp}>
            <Image style={styles.image} source={require('../assets/bland2.jpg')}/>
            <View style={styles.infoContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Марина</Text>
                <Text style={styles.status}>посмотрено</Text>
              </View>

              <Text style={styles.task}>Нужно разработать приложение</Text>
              <View style={styles.info}>
                <Text >8 откликнулись</Text>
                <View style={styles.eyeInfo}>
                  <Ionicons size={15} name="eye-outline"></Ionicons>
                  <Text style={styles.infoText}>75</Text>
                </View>
              </View>
              
            </View>

          </TouchableOpacity>

          <TouchableOpacity style={styles.cardApp}>
            <Image style={styles.image} source={require('../assets/bland3.jpg')}/>
            <View style={styles.infoContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Карина</Text>
                <Text style={styles.status}>посмотрено</Text>
              </View>

              <Text style={styles.task}>Нужно разработать приложение</Text>
              <View style={styles.info}>
                <Text >8 откликнулись</Text>
                <View style={styles.eyeInfo}>
                  <Ionicons size={15} name="eye-outline"></Ionicons>
                  <Text style={styles.infoText}>75</Text>
                </View>
              </View>
              
            </View>

          </TouchableOpacity>

          <TouchableOpacity style={styles.cardApp}>
            <Image style={styles.image} source={require('../assets/bland8.jpg')}/>
            <View style={styles.infoContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Жаксылык</Text>
                <Text style={styles.status}>посмотрено</Text>
              </View>

              <Text style={styles.task}>Нужно разработать приложение</Text>
              <View style={styles.info}>
                <Text >8 откликнулись</Text>
                <View style={styles.eyeInfo}>
                  <Ionicons size={15} name="eye-outline"></Ionicons>
                  <Text style={styles.infoText}>75</Text>
                </View>
              </View>
              
            </View>

          </TouchableOpacity>

          <TouchableOpacity style={styles.cardApp}>
            <Image style={styles.image} source={require('../assets/bland4.jpg')}/>
            <View style={styles.infoContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Айгул</Text>
                <Text style={styles.status}>посмотрено</Text>
              </View>

              <Text style={styles.task}>Нужно разработать приложение</Text>
              <View style={styles.info}>
                <Text >8 откликнулись</Text>
                <View style={styles.eyeInfo}>
                  <Ionicons size={15} name="eye-outline"></Ionicons>
                  <Text style={styles.infoText}>75</Text>
                </View>
              </View>
              
            </View>

          </TouchableOpacity>

          <TouchableOpacity style={styles.cardApp}>
            <Image style={styles.image} source={require('../assets/bland5.jpg')}/>
            <View style={styles.infoContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Жасмин</Text>
                <Text style={styles.status}>посмотрено</Text>
              </View>

              <Text style={styles.task}>Нужно разработать приложение</Text>
              <View style={styles.info}>
                <Text >8 откликнулись</Text>
                <View style={styles.eyeInfo}>
                  <Ionicons size={15} name="eye-outline"></Ionicons>
                  <Text style={styles.infoText}>75</Text>
                </View>
              </View>
              
            </View>

          </TouchableOpacity>
            



        </View> 
        
              


              
             
              <View style={styles.area}></View>
              
          
          
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
    backgroundColor: '#E2E2E2',
    borderRadius: 5,


  },
  task:{
    paddingVertical: 10,
    fontSize: 16,
  },




  image:{
    width: 70,
    height: 70,
    borderRadius: 15,
    borderWidth: 0.2,
    borderColor: '#444'
  },


});
