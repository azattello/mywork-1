import React, { useState, useEffect } from 'react';
import {
	TextInput,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
	ScrollView,
	TouchableOpacity,
	Image,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
	Keyboard,
	Alert,
	FlatList,
	ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/apiClient';

export default function Reg({ navigation }) {
	// State для многошаговой регистрации
	const [step, setStep] = useState(1); // 1: логин, 2: город, 3: категории, 4: профиль
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');
	const [surname, setSurname] = useState('');
	const [city, setCity] = useState(null);
	const [cities, setCities] = useState([]);
	const [selectedCategories, setSelectedCategories] = useState([]);
	const [categories, setCategories] = useState([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [currentRole, setCurrentRole] = useState('user');
	const [citySearch, setCitySearch] = useState('');

	// Загрузить города при монтировании
	useEffect(() => {
		loadCities();
		loadRole();
	}, []);

	// Загрузить города из API
	const loadCities = async () => {
		try {
			const res = await apiClient.request('get', '/api/cities');
			if (res.data && res.data.data) {
				setCities(res.data.data);
			}
		} catch (err) {
			console.log('Error loading cities:', err.message);
		}
	};

	// Загрузить роль из AsyncStorage
	const loadRole = async () => {
		const role = await AsyncStorage.getItem('@currentRole');
		setCurrentRole(role === 'profi' ? 'specialist' : 'user');
	};

	// Загрузить категории для этапа 3
	const loadCategories = async () => {
		try {
			const res = await apiClient.request('get', '/api/categories/tree');
			if (res.data && res.data.data) {
				setCategories(res.data.data);
			}
		} catch (err) {
			console.log('Error loading categories:', err.message);
		}
	};

	// Проверить этап 1
	const validateStep1 = () => {
		if (!phone || !password) {
			setError('Телефон и пароль обязательны');
			return false;
		}
		if (password.length < 6) {
			setError('Пароль должен быть не менее 6 символов');
			return false;
		}
		setError('');
		return true;
	};

	// Проверить этап 2
	const validateStep2 = () => {
		if (!city) {
			setError('Выберите город');
			return false;
		}
		setError('');
		return true;
	};

	// Проверить этап 3 (для специалистов)
	const validateStep3 = () => {
		if (currentRole === 'specialist') {
			if (selectedCategories.length === 0) {
				setError('Выберите хотя бы одну категорию');
				return false;
			}
		}
		setError('');
		return true;
	};

	// Проверить этап 4
	const validateStep4 = () => {
		if (!name || !surname) {
			setError('Имя и фамилия обязательны');
			return false;
		}
		setError('');
		return true;
	};

	// Переход на следующий этап
	const handleNext = async () => {
		let valid = false;
		if (step === 1) valid = validateStep1();
		else if (step === 2) valid = validateStep2();
		else if (step === 3) valid = validateStep3();
		else if (step === 4) valid = validateStep4();

		if (valid) {
			if (step === 2) {
				loadCategories(); // Загрузить категории перед шагом 3
			}
			setStep(step + 1);
		}
	};

	// Переход на предыдущий этап
	const handleBack = () => {
		if (step > 1) {
			setStep(step - 1);
		}
	};

	// Отправить регистрацию
	const handleSignUp = async () => {
		if (!validateStep4()) return;

		setLoading(true);
		try {
			const role = currentRole === 'specialist' ? 'specialist' : 'user';
			const payload = {
				name,
				surname,
				phone,
				password,
				role,
				city: city?._id,
				categories: currentRole === 'specialist' ? selectedCategories : undefined,
			};

			const res = await apiClient.request('post', '/api/auth/register', payload);
			if (res.data && res.data.success) {
				const { accessToken, refreshToken, user } = res.data.data;
				await AsyncStorage.setItem('@accessToken', accessToken);
				await AsyncStorage.setItem('@refreshToken', refreshToken);
				await AsyncStorage.setItem('@currentUser', JSON.stringify(user));
				await AsyncStorage.setItem('@userData', JSON.stringify(user));
				await AsyncStorage.setItem('@currentRole', currentRole);
				navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
				return;
			}
			setError(res.data?.message || 'Ошибка при регистрации');
			alert(res.data?.message || 'Ошибка при регистрации');
		} catch (err) {
			console.error('Registration error', err);
			setError(err.response?.data?.message || err.message);
			alert(err.response?.data?.message || err.message);
		} finally {
			setLoading(false);
		}
	};

	// Обработчик выбора категории
	const handleCategoryToggle = (categoryId) => {
		setSelectedCategories(prev => {
			if (prev.includes(categoryId)) {
				// Предотвратить удаление последней категории
				if (prev.length === 1) {
					Alert.alert('Ошибка', 'Требуется минимум одна категория');
					return prev;
				}
				return prev.filter(id => id !== categoryId);
			}
			return [...prev, categoryId];
		});
	};

	const AuthFunc = () => {
		navigation.navigate('Auth');
	};

	// Фильтрованные города по поиску
	const filteredCities = cities.filter(c =>
		c.name.toLowerCase().includes(citySearch.toLowerCase())
	);

	// Отрендерить ЭТАП 1: Телефон и пароль
	const renderStep1 = () => (
		<View>
			<Text style={styles.stepLabel}>Шаг 1 из {currentRole === 'specialist' ? '4' : '3'}</Text>
			<Text style={styles.title}>Авторизация</Text>
			<Text style={styles.subtitle}>Введите телефон и пароль</Text>

			<Text style={styles.label}>Номер телефона</Text>
			<TextInput
				style={styles.input}
				placeholder="+77478473737"
				keyboardType="phone-pad"
				value={phone}
				onChangeText={setPhone}
			/>

			<Text style={styles.label}>Пароль</Text>
			<TextInput
				style={styles.input}
				placeholder="Минимум 6 символов"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
		</View>
	);

	// Отрендерить ЭТАП 2: Выбор города
	const renderStep2 = () => (
		<View>
			<Text style={styles.stepLabel}>Шаг 2 из {currentRole === 'specialist' ? '4' : '3'}</Text>
			<Text style={styles.title}>Выберите город</Text>

			<Text style={styles.label}>Город</Text>
			<TextInput
				style={styles.input}
				placeholder="Поиск города..."
				value={citySearch}
				onChangeText={setCitySearch}
			/>

			<FlatList
				data={filteredCities}
				keyExtractor={item => item._id}
				scrollEnabled={false}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={[
							styles.cityItem,
							city?._id === item._id && styles.cityItemSelected
						]}
						onPress={() => {
							setCity(item);
							setCitySearch('');
						}}
					>
						<Text style={[
							styles.cityItemText,
							city?._id === item._id && styles.cityItemTextSelected
						]}>
							{item.name}
						</Text>
						<Text style={styles.regionText}>{item.region}</Text>
					</TouchableOpacity>
				)}
			/>

			{city && (
				<View style={styles.selectedCity}>
					<Text style={styles.selectedCityText}>✓ Выбран: {city.name}</Text>
				</View>
			)}
		</View>
	);

	// Отрендерить ЭТАП 3: Выбор категорий (только для специалистов) или Профиль (для заказчиков)
	const renderStep3 = () => {
		if (currentRole === 'specialist') {
			// Для специалистов: этап 3 = выбор категорий
			return (
				<View>
					<Text style={styles.stepLabel}>Шаг 3 из 4</Text>
					<Text style={styles.title}>Выберите категории</Text>
					<Text style={styles.subtitle}>Минимум одна категория</Text>

					{categories.length === 0 ? (
						<ActivityIndicator size="large" color="#EC1B23" style={{ marginVertical: 20 }} />
					) : (
						<FlatList
							data={categories}
							keyExtractor={item => item._id}
							scrollEnabled={false}
							renderItem={({ item }) => (
								<View key={item._id}>
									{/* Основная категория */}
									<TouchableOpacity
										style={[
											styles.categoryItem,
											selectedCategories.includes(item._id) && styles.categoryItemSelected
										]}
										onPress={() => handleCategoryToggle(item._id)}
									>
										<Text style={styles.categoryCheckbox}>
											{selectedCategories.includes(item._id) ? '✓' : '○'}
										</Text>
										<Text style={[
											styles.categoryText,
											selectedCategories.includes(item._id) && styles.categoryTextSelected
										]}>
											{item.icon} {item.name}
										</Text>
									</TouchableOpacity>

									{/* Подкатегории */}
									{item.subcategories && item.subcategories.map(sub => (
										<TouchableOpacity
											key={sub._id}
											style={[
												styles.subCategoryItem,
												selectedCategories.includes(sub._id) && styles.subCategoryItemSelected
											]}
											onPress={() => handleCategoryToggle(sub._id)}
										>
											<Text style={styles.categoryCheckbox}>
												{selectedCategories.includes(sub._id) ? '✓' : '○'}
											</Text>
											<Text style={[
												styles.subCategoryText,
												selectedCategories.includes(sub._id) && styles.subCategoryTextSelected
											]}>
												{sub.icon} {sub.name}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							)}
						/>
					)}

					{selectedCategories.length > 0 && (
						<View style={styles.selectedCount}>
							<Text style={styles.selectedCountText}>
								Выбрано: {selectedCategories.length}
							</Text>
						</View>
					)}
				</View>
			);
		} else {
			// Для заказчиков: этап 3 = профиль (имя и фамилия)
			return (
				<View>
					<Text style={styles.stepLabel}>Шаг 3 из 3</Text>
					<Text style={styles.title}>Профиль</Text>
					<Text style={styles.subtitle}>Завершите регистрацию</Text>

					<Text style={styles.label}>Имя</Text>
					<TextInput
						style={styles.input}
						placeholder="Имя"
						keyboardType="default"
						autoCapitalize="words"
						value={name}
						onChangeText={setName}
					/>

					<Text style={styles.label}>Фамилия</Text>
					<TextInput
						style={styles.input}
						placeholder="Фамилия"
						keyboardType="default"
						autoCapitalize="words"
						value={surname}
						onChangeText={setSurname}
					/>
				</View>
			);
		}
	};

	// Отрендерить ЭТАП 4: Профиль (Имя и фамилия) - только для специалистов
	const renderStep4 = () => {
		if (currentRole !== 'specialist') {
			return null;
		}

		return (
			<View>
				<Text style={styles.stepLabel}>Шаг 4 из 4</Text>
				<Text style={styles.title}>Профиль</Text>
				<Text style={styles.subtitle}>Завершите регистрацию</Text>

				<Text style={styles.label}>Имя</Text>
				<TextInput
					style={styles.input}
					placeholder="Имя"
					keyboardType="default"
					autoCapitalize="words"
					value={name}
					onChangeText={setName}
				/>

				<Text style={styles.label}>Фамилия</Text>
				<TextInput
					style={styles.input}
					placeholder="Фамилия"
					keyboardType="default"
					autoCapitalize="words"
					value={surname}
					onChangeText={setSurname}
				/>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.gstyle}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<ScrollView
						contentContainerStyle={styles.scrollContainer}
						keyboardShouldPersistTaps="handled"
						keyboardDismissMode="on-drag"
					>
						<View style={styles.container}>
							<Image style={styles.logo} source={require('../assets/logo.png')} />

							{/* Индикатор шагов */}
							<View style={styles.stepsIndicator}>
								{[1, 2, currentRole === 'specialist' ? 3 : null, currentRole === 'specialist' ? 4 : 3]
									.filter(Boolean)
									.map((s, idx) => (
										<View
											key={idx}
											style={[
												styles.stepDot,
												step >= s && styles.stepDotActive
											]}
										/>
									))}
							</View>

							{/* Рендеринг текущего этапа */}
							{step === 1 && renderStep1()}
							{step === 2 && renderStep2()}
							{step === 3 && renderStep3()}
							{currentRole === 'specialist' && step === 4 && renderStep4()}

							{/* Сообщение об ошибке */}
							{error !== '' && (
								<Text style={styles.errorText}>{error}</Text>
							)}

							{/* Кнопки навигации */}
							<View style={styles.buttonContainer}>
								{step > 1 && (
									<TouchableOpacity
										style={[styles.AuthButton, styles.backButton]}
										onPress={handleBack}
									>
										<Text style={styles.buttonText}>← Назад</Text>
									</TouchableOpacity>
								)}

								{step < (currentRole === 'specialist' ? 4 : 3) ? (
									<TouchableOpacity
										style={[styles.AuthButton, { marginTop: 10, flex: 1, marginLeft: step > 1 ? 10 : 0 }]}
										onPress={handleNext}
										disabled={loading}
									>
										<Text style={styles.buttonText}>Далее →</Text>
									</TouchableOpacity>
								) : (
									<TouchableOpacity
										style={[styles.AuthButton, { marginTop: 10, flex: 1, marginLeft: step > 1 ? 10 : 0 }]}
										onPress={handleSignUp}
										disabled={loading}
									>
										<Text style={styles.buttonText}>
											{loading ? 'Регистрация...' : 'Зарегистрироваться'}
										</Text>
									</TouchableOpacity>
								)}
							</View>

							<TouchableOpacity style={styles.noAuthButton} onPress={AuthFunc}>
								<Text style={styles.pText}>Уже есть аккаунт? <Text style={{ color: '#EC1B23', fontWeight: '600' }}>Вход</Text></Text>
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
		backgroundColor: '#FFF'
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: 'flex-start',
		paddingBottom: 30
	},
	container: {
		flex: 1,
		paddingHorizontal: 16,
		paddingVertical: 10
	},
	logo: {
		width: 50,
		height: 50,
		alignSelf: 'center',
		marginTop: 20
	},
	stepsIndicator: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginVertical: 20,
		gap: 8
	},
	stepDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#DDD'
	},
	stepDotActive: {
		backgroundColor: '#EC1B23'
	},
	stepLabel: {
		fontSize: 12,
		color: '#999',
		marginBottom: 8
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 8,
		color: '#222'
	},
	subtitle: {
		fontSize: 14,
		color: '#606060',
		marginBottom: 20
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
		color: '#333'
	},
	input: {
		marginBottom: 16,
		fontSize: 16,
		backgroundColor: '#F5F6FA',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: '#222'
	},
	cityItem: {
		padding: 12,
		marginBottom: 8,
		backgroundColor: '#F5F6FA',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E0E0E0'
	},
	cityItemSelected: {
		backgroundColor: '#FFF5F5',
		borderColor: '#EC1B23'
	},
	cityItemText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#222'
	},
	cityItemTextSelected: {
		color: '#EC1B23'
	},
	regionText: {
		fontSize: 12,
		color: '#999',
		marginTop: 4
	},
	selectedCity: {
		backgroundColor: '#FFF5F5',
		padding: 12,
		borderRadius: 8,
		borderLeftWidth: 4,
		borderLeftColor: '#EC1B23',
		marginTop: 12
	},
	selectedCityText: {
		color: '#EC1B23',
		fontWeight: '600'
	},
	categoryItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		marginBottom: 8,
		backgroundColor: '#F5F6FA',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E0E0E0'
	},
	categoryItemSelected: {
		backgroundColor: '#FFF5F5',
		borderColor: '#EC1B23'
	},
	categoryCheckbox: {
		fontSize: 16,
		marginRight: 10,
		width: 20,
		textAlign: 'center'
	},
	categoryText: {
		flex: 1,
		fontSize: 14,
		fontWeight: '600',
		color: '#222'
	},
	categoryTextSelected: {
		color: '#EC1B23'
	},
	subCategoryItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		marginLeft: 30,
		marginBottom: 6,
		backgroundColor: '#FAFAFA',
		borderRadius: 6,
		borderWidth: 1,
		borderColor: '#E8E8E8'
	},
	subCategoryItemSelected: {
		backgroundColor: '#FFF9F9',
		borderColor: '#EC1B23'
	},
	subCategoryText: {
		flex: 1,
		fontSize: 13,
		color: '#555'
	},
	subCategoryTextSelected: {
		color: '#EC1B23',
		fontWeight: '600'
	},
	selectedCount: {
		backgroundColor: '#FFF5F5',
		padding: 12,
		borderRadius: 8,
		marginTop: 12
	},
	selectedCountText: {
		color: '#EC1B23',
		fontWeight: '600',
		textAlign: 'center'
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 24,
		gap: 10
	},
	AuthButton: {
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
	backButton: {
		flex: 0.3,
		backgroundColor: '#E8E8E8'
	},
	buttonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600'
	},
	errorText: {
		color: '#EC1B23',
		fontSize: 13,
		marginVertical: 12,
		padding: 10,
		backgroundColor: '#FFF5F5',
		borderRadius: 8
	},
	noAuthButton: {
		marginTop: 16,
		alignSelf: 'center'
	},
	pText: {
		color: '#606060'
	}
});

