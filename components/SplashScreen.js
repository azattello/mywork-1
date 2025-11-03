import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userID = await AsyncStorage.getItem('@currentUser');
        const delay = new Promise(resolve => setTimeout(resolve, 1000));
        await delay;

        if (userID) {
          navigation.navigate('Main');
        } else {
          navigation.navigate('Role');
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        navigation.navigate('Role');
      }
    };

    checkLogin();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Image
        style={styles.logo}
        source={require('../assets/logo.png')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 106,
  },
});

export default SplashScreen;
