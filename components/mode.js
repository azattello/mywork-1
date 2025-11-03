import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';


export default function Mode({navigation}) {
    const [selectedMod, setSelectedMod] = useState('Дистанционно');
    
    const handleModePress = async (text) => {
        try {
          await AsyncStorage.setItem('@mode', text);
          console.log('Текст сохранен в AsyncStorage:', text);
        } catch (error) {
          console.error('Ошибка при сохранении текста:', error);
        }
      };


    const handleModFunc1 = () => {
        setSelectedMod('Дистанционно');
        handleModePress('Дистанционно');
    }
    const handleModFunc2 = () => {
        setSelectedMod('У клиента');
        handleModePress('У клиента');

    }

    const handleModFunc3 = () => {
        setSelectedMod('У специалиста');
        handleModePress('У специалиста');

    }


  
    return (
      <View>
          <View style={styles.sectionWrapper} >
            <TouchableOpacity style={selectedMod === 'Дистанционно' ? styles.sectionEl: styles.sectionElOff} onPress={handleModFunc1}>
                <Text style={selectedMod === 'Дистанционно' ? styles.sectionEltext: styles.sectionEltextOff}>Дистанционно</Text>
            </TouchableOpacity>
            <TouchableOpacity style={selectedMod === 'У клиента' ? styles.sectionEl: styles.sectionElOff} onPress={handleModFunc2}>
                <Text style={selectedMod === 'У клиента' ? styles.sectionEltext: styles.sectionEltextOff}>У клиента</Text>
            </TouchableOpacity>
            <TouchableOpacity style={selectedMod === 'У специалиста' ? styles.sectionEl: styles.sectionElOff} onPress={handleModFunc3}>
                <Text style={selectedMod === 'У специалиста' ? styles.sectionEltext: styles.sectionEltextOff}>У специалиста</Text>
            </TouchableOpacity>
          </View>
  
      </View>
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
  sectionEl:{
    backgroundColor: '#E35F65',
    height: 50,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    // paddingHorizontal: 20,
    // paddingVertical: 20,

  },
  sectionElOff:{
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',

  },
  sectionEltext:{
    color: '#fff'
  },
  sectionEltextOff:{
    color: '#000'
  },

  sectionWrapper:{
    backgroundColor: '#fff',
    marginTop: 30,
    borderRadius: 5,

  
    shadowColor: "#999696",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 10,

    flexDirection: 'row',
    justifyContent: 'space-around',

    
  },
  Collapsible:{
    marginTop: 10,
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
