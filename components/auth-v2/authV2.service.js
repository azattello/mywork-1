import apiClient from '../../utils/apiClient';

export const authV2 = {
  passwordLogin: (phone, password) => apiClient.post('/api/auth-v2/password/login', { phone, password }),
  startSmsLogin: (phone) => apiClient.post('/api/auth-v2/sms-login/start', { phone }),
  verifySmsLogin: (challengeId, code) => apiClient.post('/api/auth-v2/sms-login/verify', { challengeId, code }),
  startRegistration: (payload) => apiClient.post('/api/auth-v2/registration/start', payload),
  verifyRegistration: (challengeId, code) => apiClient.post('/api/auth-v2/registration/verify', { challengeId, code }),
  verifyTwoFactor: (challengeId, code) => apiClient.post('/api/auth-v2/2fa/verify', { challengeId, code }),
  startPasswordReset: (phone) => apiClient.post('/api/auth-v2/password-reset/start', { phone }),
  completePasswordReset: (challengeId, code, password) => apiClient.post('/api/auth-v2/password-reset/complete', { challengeId, code, password }),
};

export const saveAuthSession = async (data) => {
  const { accessToken, refreshToken, user } = data;
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.setItem('@accessToken', accessToken);
  await AsyncStorage.setItem('@refreshToken', refreshToken);
  await AsyncStorage.setItem('@currentUser', JSON.stringify(user));
  await AsyncStorage.setItem('@userData', JSON.stringify(user));
  await AsyncStorage.setItem('@currentRole', user.role || 'user');
};