import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppRegistry, TextInput, SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';
import { initializeSocket } from '../utils/socketService';

// UI improvements: logo, clearer error messages, and password visibility toggle


export default function Auth({navigation}) {
	
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [count, setCount] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const RegFunc = () => {
	  navigation.navigate('Reg');
	}

	const handleSignIn = async () => {
	  setError('');
	  if (!phone || !password) {
	    Toast.error('Введите телефон и пароль');
	    return;
	  }
	  setLoading(true);
	  try {
	    const res = await apiClient.request('post', '/api/auth/login', { phone, password });
	    if (res.data && res.data.success) {
	      const { accessToken, refreshToken, user } = res.data.data;
	      await AsyncStorage.setItem('@accessToken', accessToken);
	      await AsyncStorage.setItem('@refreshToken', refreshToken);
	      await AsyncStorage.setItem('@currentUser', JSON.stringify(user));
	      await AsyncStorage.setItem('@userData', JSON.stringify(user));
	      await AsyncStorage.setItem('@currentRole', user.role);
	      
	      // Initialize socket connection
	      try {
	        initializeSocket(user._id);
	        console.log('Socket initialized for user:', user._id);
	      } catch (socketErr) {
	        console.error('Failed to initialize socket:', socketErr);
	      }
	      
	      Toast.success('Добро пожаловать!');
	      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
	      return;
	    }
	    Toast.error(res.data?.message || 'Ошибка авторизации');
	  } catch (err) {
	    console.error('Login error', err);
	    if (err.response && err.response.data && err.response.data.message) {
	      Toast.error(err.response.data.message);
	    } else {
	      Toast.error('Ошибка авторизации');
	    }
	  } finally {
	    setLoading(false);
	  }
	};

  return (

    <SafeAreaView style={styles.gstyle}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <View style={styles.container}>
              <Image style={styles.logo} source={require('../assets/logo.png')} />
              <Text style={styles.title}>Вход в аккаунт</Text>
              <Text style={styles.subtitle}>Рады видеть — войдите, чтобы продолжить</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                placeholder="Пароль"
                secureTextEntry={!showPassword}
                onChangeText={(text) => setPassword(text)}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPasswordButton}>
                <Text style={styles.showPasswordText}>{showPassword ? 'Скрыть пароль' : 'Показать пароль'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.AuthButton, loading ? styles.disabledButton : {}]} onPress={handleSignIn} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Вход...' : 'Войти'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.noAuthButton} onPress={RegFunc}>
                <Text style={styles.noAuthText}>Нет аккаунта? Зарегистрируйтесь</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
	gstyle: {
		flex: 1,
		backgroundColor: '#F7F8FB',
		paddingHorizontal: 18,
		paddingVertical: 18,
		justifyContent: 'center'
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 24,
		paddingBottom: 120
	},
	container: {
		width: '100%',
		maxWidth: 420,
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 18,
		alignSelf: 'center',
		minHeight: 380,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.06,
		shadowRadius: 18,
		elevation: 5,
	},
	logo: {
		width: 160,
		height: 72,
		alignSelf: 'center',
		marginBottom: 12,
		resizeMode: 'contain'
	},
	title: {
		fontWeight: '700',
		fontSize: 20,
		textAlign: 'center',
		marginBottom: 4,
		color: '#222'
	},
	subtitle: {
		fontSize: 13,
		color: '#666',
		textAlign: 'center',
		marginBottom: 14
	},
	errorText: {
		color: '#D04545',
		textAlign: 'center',
		marginBottom: 8
	},
	label: {
		fontSize: 13,
		marginTop: 8,
		color: '#606060'
	},
	input: {
		marginTop: 8,
		fontSize: 16,
		backgroundColor: '#F5F6FA',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: '#222'
	},
	showPasswordButton: {
		alignSelf: 'flex-end',
		marginTop: 8,
		marginBottom: 4
	},
	disabledButton: {
		opacity: 0.6,
		backgroundColor: '#bbb'
	},
	showPasswordText: {
		color: '#EC1B23',
		fontSize: 13
	},
	AuthButton: {
		marginTop: 18,
		width: '100%',
		height: 52,
		borderRadius: 12,
		backgroundColor: '#EC1B23',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#EC1B23',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.12,
		shadowRadius: 16,
		elevation: 4
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600'
	},
	noAuthButton: {
		marginTop: 14,
		alignSelf: 'center'
	},
	noAuthText: {
		color: '#606060'
	}
});

