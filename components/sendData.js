import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export const sendData = async (data, navigation) => {
	try {
		// Если у вас есть токен авторизации, можно добавить его
		let token = null;
		try {
			token = await AsyncStorage.getItem('@accessToken');
		} catch (e) {
			// ignore
		}

		const headers = token ? { Authorization: `Bearer ${token}` } : {};

		const res = await axios.post(`${API_URL}/api/applications`, data, { headers });
		if (res.data && res.data.success) {
			console.log('Application created', res.data.data);
			// navigate to applications list (TabNav -> 'Заявки')
			navigation.navigate('TabNav', { screen: 'Заявки' });
		} else {
			console.warn('Unexpected response from server', res.data);
			alert(res.data?.message || 'Ошибка при создании заявки');
		}
	} catch (err) {
		console.error('Error sending application:', err);
		const msg = err.response?.data?.message || err.message || 'Ошибка сети';
		alert(msg);
	}
};
	