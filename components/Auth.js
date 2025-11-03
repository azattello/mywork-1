import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppRegistry, TextInput, SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';


export default function Auth({navigation}) {
	
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [count, setCount] = useState('');
	const [error, setError] = useState('');




	const RegFunc = ()=>{
        navigation.navigate('Reg')
    }

	const handleSignIn = async () => {
	  setError('');
	  if (!phone || !password) {
	    setError('Введите телефон и пароль');
	    return;
	  }
	  try {
	    const res = await axios.post(`${API_URL}/api/auth/login`, {
	      phone,
	      password
	    });
	    const { accessToken, refreshToken, user } = res.data.data;
	    await AsyncStorage.setItem('@accessToken', accessToken);
	    await AsyncStorage.setItem('@refreshToken', refreshToken);
	    await AsyncStorage.setItem('@currentUser', JSON.stringify(user));
	    navigation.navigate('Main');
	  } catch (err) {
	    if (err.response && err.response.data && err.response.data.message) {
	      setError(err.response.data.message);
	    } else {
	      setError('Ошибка авторизации');
	    }
	  }
	};

  return (

    <SafeAreaView style={styles.gstyle}>
        
		<View style={styles.container}>
			<Text style={styles.title}>Вход</Text>
			{error ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{error}</Text> : null}
			<Text style={styles.label}>Номер телефона</Text>
			<TextInput
				style={styles.input}
				placeholder="+77478473737"
				keyboardType="phone-pad"
				autoCapitalize="none"
				onChangeText={(text) => setPhone(text)}
			/>
			<Text style={styles.label}>Пароль</Text>
			<TextInput
				style={styles.input}
				placeholder="Password"
				secureTextEntry
				onChangeText={(text) => setPassword(text)}
			/>
			<View style={styles.buttonWrapper}>
				<TouchableOpacity style={styles.AuthButton} onPress={handleSignIn}>
					<Text style={styles.buttonText}>Войти</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity style={styles.noAuthButton} onPress={RegFunc}>
				<Text style={styles.pText} >
					Не зарегистрированы в системе?
				</Text>
			</TouchableOpacity>
		</View>
        
    </SafeAreaView>
  
  );
}

const styles = StyleSheet.create({
	gstyle: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	container: {
		marginTop: 200,
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

