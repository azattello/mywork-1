import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const data = [
  { id: 1, name: 'Алматы' },
  { id: 2, name: 'Нур-Султан' },
  { id: 3, name: 'Шымкент' },
  { id: 4, name: 'Актобе' },
  { id: 5, name: 'Талдыкорган' },
  { id: 6, name: 'Атырау' },
  { id: 7, name: 'Усть-Каменогорск' },
  { id: 8, name: 'Семей' },
  { id: 9, name: 'Тараз' },
  { id: 10, name: 'Караганда' },
  { id: 11, name: 'Костанай' },
  { id: 12, name: 'Байконур' },
  { id: 13, name: 'Актау' },
  { id: 14, name: 'Павлодар' },
  { id: 15, name: 'Петропавловск' },
  { id: 16, name: 'Туркестан' },

  // Добавьте вашу реальную данные здесь
];

export default function Cities({navigation}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  

  const handleSearch = (query) => {
    const filtered = data.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
    setSearchQuery(query);
  };

    const handleCityPress = async (text) => {
        try {
          await AsyncStorage.setItem('@city', text);
          console.log('Текст сохранен в AsyncStorage:', text);
        } catch (error) {
          console.error('Ошибка при сохранении текста:', error);
        }
        // navigation.navigate('TabNav', { screen: 'Создать' });
        navigation.goBack();
      };

  return (
    <SafeAreaView style={styles.wrapper}>
    <StatusBar
      backgroundColor="#fff"
    />
   
   <View style={styles.header}>
      <View style={styles.inputContainer}>
      <Ionicons size={25} color={'#ABABAB'} name="search-outline"></Ionicons>
        <TextInput
        style={styles.input}
        placeholder="Поиск городов"
        keyboardType="default"
        autoCapitalize="none"
        value={searchQuery}
        onChangeText={handleSearch}
        />
      </View>
    </View>
              
    <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.choiceCityEl} onPress={() => handleCityPress(item.name)} >
            <Text style={styles.choiceCityElText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
{/*       
        <TouchableOpacity style={styles.choiceCityEl} onPress={() => handleCityPress('Алматы')} >
            <Text style={styles.choiceCityElText}>Алматы</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Нур-Султан')} >
            <Text style={styles.choiceCityElText}>Нур-Султан</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Шымкент')} >
            <Text style={styles.choiceCityElText}>Шымкент</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Актобе')} >
            <Text style={styles.choiceCityElText}>Актобе</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Талдыкорган')} >
            <Text style={styles.choiceCityElText}>Талдыкорган</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Атырау')} >
            <Text style={styles.choiceCityElText}>Атырау</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Усть-Каменогорск')} >
            <Text style={styles.choiceCityElText}>Усть-Каменогорск</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Семей')} >
            <Text style={styles.choiceCityElText}>Семей</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Тараз')} >
            <Text style={styles.choiceCityElText}>Тараз</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Караганда')} >
            <Text style={styles.choiceCityElText}>Караганда</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Костанай')} >
            <Text style={styles.choiceCityElText}>Костанай</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Байконур')} >
            <Text style={styles.choiceCityElText}>Байконур</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Актау')} >
            <Text style={styles.choiceCityElText}>Актау</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Павлодар')} >
            <Text style={styles.choiceCityElText}>Павлодар</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Петропавловск')} >
            <Text style={styles.choiceCityElText}>Петропавловск</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choiceCityEl2} onPress={() => handleCityPress('Туркестан')} >
            <Text style={styles.choiceCityElText}>Туркестан</Text>
        </TouchableOpacity> */}
        
        


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
      choiceCityEl:{
        paddingHorizontal: 30,
        paddingVertical: 25,
        backgroundColor: '#fff',
        borderColor: '#EBEBEB',
        borderTopWidth: 1,
        borderBottomWidth: 1,


      },
      choiceCityEl2:{
        paddingHorizontal: 30,
        paddingVertical: 25,
        backgroundColor: '#fff',
        borderColor: '#D0D0D0',
        borderBottomWidth: 1,
      },
      choiceCityElText:{
        fontSize: 16,

      },

});
