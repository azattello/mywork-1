import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import AppsList from './appsList';

import ActiveApps from './activeApps';
import NoActiveApps from './noActiveApps';

export default function Apps({navigation}) {
  const [currentPage, setCurrentPage] = useState('Page1');
  const [isChoice, setIsChoice] = useState(true);

  const switchToChoice1 = () => {
    setCurrentPage('Page1')
    setIsChoice(true)
  };

  const switchToChoice2 = () => {
    setIsChoice(false)
    setCurrentPage('Page2')
  };

  const supportRef = ()=>{
    navigation.navigate('Служба поддержки');
  }


  const renderPage = () => {
    if (currentPage === 'Page1') {
      return <ActiveApps/>;
    } else if (currentPage === 'Page2') {
      return  <NoActiveApps/>;
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
        <StatusBar
          backgroundColor="#fff"
          name={'safd'}
        />
    
        <View style={styles.container}>
            <TouchableOpacity style={isChoice ? styles.choice1 : styles.choice2} onPress={switchToChoice1}>
              <Text style={isChoice ? styles.choiceText : styles.choiceText2}>Активные</Text>
            </TouchableOpacity>

            <TouchableOpacity style={!isChoice ? styles.choice1 : styles.choice2} onPress={switchToChoice2}>
              <Text style={isChoice ? styles.choiceText2 : styles.choiceText}>Неактивные</Text>
            </TouchableOpacity>
        </View>

        {renderPage()}

  </SafeAreaView>
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
    fontSize: 20,
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
  choiceText2:{
    color: '#000',
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
});
