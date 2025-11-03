import React, { useState, useEffect } from 'react';
import { AppRegistry, TextInput, SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

export default function Reg({navigation}) {

	const [name, setName] = useState('');
	const [surname, setSurname] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [userID, setUserID] = useState('');


	const AuthFunc = ()=>{
        navigation.navigate('Auth')
    }


	const validatePassword = () => {
		// Простая валидация пароля
		return password.length >= 6; // Минимальная длина пароля
	};

	const handleSignUp = async () => {
		try {
			if (phone === '' || name === '' || surname === '' || password === '') {
				setError('Все поля обязательны для заполнения');
				alert(error);
				return;
			}

			if (!validatePassword()) {
				setError('Пароль должен быть не менее 6 символов');
				alert(error);
				return;
			}

			const response = await axios.post(`${API_URL}/api/auth/register`, {
				name,
				surname,
				phone,
				password,
				role: 'user'
			});

			const { data } = response;
			
			if (data.success) {
				// Сохраняем токены и данные пользователя
				await AsyncStorage.setItem('@accessToken', data.data.accessToken);
				await AsyncStorage.setItem('@refreshToken', data.data.refreshToken);
				await AsyncStorage.setItem('@userData', JSON.stringify(data.data.user));
				
				console.log('Регистрация успешна!');
				navigation.navigate('Main');
			} else {
				setError(data.message || 'Ошибка при регистрации');
				alert(error);
			}
		} catch (error) {
			console.error('Ошибка при регистрации:', error);
			setError(error.response?.data?.message || error.message);
			alert(error.response?.data?.message || error.message);
		}
	};
	

  return (

    <SafeAreaView>
      <ScrollView style={styles.scrollStyle}>
        
        <View style={styles.container}>
            <Text style={styles.title}>Регистрация</Text>
            
            <Text style={styles.label}>Имя</Text>
            <TextInput
                style={styles.input}
                placeholder="Имя"
                keyboardType="default"
                autoCapitalize="none"
				onChangeText={(text) => setName(text)}
            />

            <Text style={styles.label}>Фамилия</Text>
            <TextInput
                style={styles.input}
                placeholder="Фамилия"
                keyboardType="default"
                autoCapitalize="none"
				onChangeText={(text) => setSurname(text)}

            />

            <Text style={styles.label}>Номер телефона</Text>
            <TextInput
                style={styles.input}
                placeholder="+77478473737"
                keyboardType="phone-pad"
                autoCapitalize="none"
				onChangeText={(text) => setPhone(text)}

            />

            <Text style={styles.label}>Придумайте пароль</Text>
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
				onChangeText={(text) => setPassword(text)} 
            />

            <View style={styles.buttonWrapper}>
                <TouchableOpacity style={styles.AuthButton} onPress={handleSignUp}>
                    <Text style={styles.buttonText}>Регистрация</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.noAuthButton} onPress={AuthFunc}>
              <Text style={styles.pText} >
                Уже есть аккаунт?
              </Text>
            </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  
  );
}

const styles = StyleSheet.create({
  scrollStyle: {
    paddingHorizontal: 20,
  },
	container: {
		marginTop: 100,
		paddingHorizontal: 30,
		paddingVertical: 50,
		width: '100%',
		backgroundColor: '#fff',
		borderRadius: 20,
		paddingBottom: 40,
		
	},
	title: {
		fontWeight: '500',
		fontSize: 25,
		textAlign: 'center',
		marginBottom: 30,

	},
	label: {
		fontSize: 16,
		marginTop: 10,
		paddingLeft: 10,
		color: '#393939'
	},
	input: {
		marginVertical: 12,
		fontSize: 14,
		borderWidth: 1,
		borderRadius: 10,
		borderColor: '#B6B6B6',
		width: '100%',
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	buttonWrapper: {
		backgroundColor: '#EC1B23',
		borderColor: '#EC1B23',
		borderWidth: 1,
		borderRadius: 16,
		padding: 1.5,
		marginTop: 30,

	},
	AuthButton: {
		width: '100%',
		height: 50,
		borderRadius: 14,
		backgroundColor: '#EC1B23',
		alignItems: 'center',
		justifyContent: 'center',

	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
	},
	pText: {
		color: '#EC1B23',
		textAlign: 'center',
	},
	noAuthButton: {
		marginTop: 15,
		width: '100%',
		height: 50,
		borderWidth: 1,
		borderRadius: 14,
		borderColor: '#EC1B23',
		alignItems: 'center',
		justifyContent: 'center',
		
		
	}
});

