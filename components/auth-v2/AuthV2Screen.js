import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authV2, saveAuthSession } from './authV2.service';

const initialForm = { phone: '', password: '', name: '', surname: '', confirmPassword: '' };

const getErrorMessage = (error) => error?.response?.data?.message || 'Не удалось выполнить запрос. Проверьте данные и попробуйте снова.';

export default function AuthV2Screen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const resetError = () => setError('');

  const beginChallenge = (result, nextMode) => {
    const data = result.data.data;
    setChallenge(data);
    setOtp('');
    setCooldown(data.resendIn || 45);
    setMode(nextMode);
    if (data.developmentCode) Alert.alert('Development OTP', `Код: ${data.developmentCode}`);
  };

  const submit = async () => {
    resetError();
    if (!form.phone.trim()) return setError('Введите номер телефона');
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await authV2.passwordLogin(form.phone, form.password);
        if (result.data.data.requiresTwoFactor) beginChallenge(result, 'twoFactor');
        else await completeLogin(result.data.data);
      } else if (mode === 'smsLogin') {
        beginChallenge(await authV2.startSmsLogin(form.phone), 'smsVerify');
      } else if (mode === 'register') {
        if (form.password !== form.confirmPassword) throw new Error('Пароли не совпадают');
        beginChallenge(await authV2.startRegistration({ phone: form.phone, password: form.password, name: form.name, surname: form.surname }), 'registrationVerify');
      } else if (mode === 'forgot') {
        beginChallenge(await authV2.startPasswordReset(form.phone), 'resetVerify');
      } else if (mode === 'resetVerify') {
        if (!form.password || form.password !== form.confirmPassword) throw new Error('Пароли не совпадают');
        await authV2.completePasswordReset(challenge.challengeId, otp, form.password);
        setMode('login');
        setChallenge(null);
        setOtp('');
        Alert.alert('Готово', 'Пароль успешно изменён');
      } else if (['smsVerify', 'registrationVerify', 'twoFactor'].includes(mode)) {
        if (!/^\d{6}$/.test(otp)) throw new Error('Введите 6-значный код');
        const result = mode === 'smsVerify'
          ? await authV2.verifySmsLogin(challenge.challengeId, otp)
          : mode === 'registrationVerify'
            ? await authV2.verifyRegistration(challenge.challengeId, otp)
            : await authV2.verifyTwoFactor(challenge.challengeId, otp);
        await completeLogin(result.data.data);
      }
    } catch (requestError) {
      setError(requestError.message === 'Пароли не совпадают' || requestError.message === 'Введите 6-значный код' ? requestError.message : getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (data) => {
    await saveAuthSession(data);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const resend = async () => {
    if (cooldown || !challenge) return;
    try {
      const request = mode === 'smsVerify'
        ? authV2.startSmsLogin(form.phone)
        : mode === 'registrationVerify'
          ? authV2.startRegistration({ phone: form.phone, password: form.password, name: form.name, surname: form.surname })
          : mode === 'resetVerify'
            ? authV2.startPasswordReset(form.phone)
            : null;
      if (request) {
        const result = await request;
        beginChallenge(result, mode);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const title = mode === 'register' ? 'Создание аккаунта' : mode === 'forgot' ? 'Восстановление пароля' : ['smsVerify', 'registrationVerify', 'resetVerify', 'twoFactor'].includes(mode) ? 'Введите код из SMS' : mode === 'smsLogin' ? 'Вход по SMS' : 'Вход в аккаунт';
  const isOtp = ['smsVerify', 'registrationVerify', 'resetVerify', 'twoFactor'].includes(mode);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.brand}>mywork</Text>
            <Text style={styles.title}>{title}</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}

            {isOtp ? (
              <>
                <Text style={styles.subtitle}>Код отправлен на {challenge?.phone}</Text>
                <TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="Введите 6 цифр" keyboardType="number-pad" maxLength={6} />
                {mode === 'resetVerify' && <><TextInput style={styles.input} value={form.password} onChangeText={(value) => update('password', value)} placeholder="Новый пароль" secureTextEntry /><TextInput style={styles.input} value={form.confirmPassword} onChangeText={(value) => update('confirmPassword', value)} placeholder="Повторите пароль" secureTextEntry /></>}
                <PrimaryButton text={mode === 'resetVerify' ? 'Изменить пароль' : 'Подтвердить'} onPress={submit} loading={loading} />
                {mode !== 'twoFactor' && <TouchableOpacity onPress={resend} disabled={!!cooldown}><Text style={styles.link}>{cooldown ? `Отправить код повторно через ${cooldown} сек.` : 'Отправить код повторно'}</Text></TouchableOpacity>}
              </>
            ) : (
              <>
                {mode === 'register' && <><TextInput style={styles.input} value={form.name} onChangeText={(value) => update('name', value)} placeholder="Имя" /><TextInput style={styles.input} value={form.surname} onChangeText={(value) => update('surname', value)} placeholder="Фамилия" /></>}
                <TextInput style={styles.input} value={form.phone} onChangeText={(value) => update('phone', value)} placeholder="Номер телефона" keyboardType="phone-pad" />
                {['login', 'register'].includes(mode) && <><TextInput style={styles.input} value={form.password} onChangeText={(value) => update('password', value)} placeholder="Пароль" secureTextEntry />{mode === 'register' && <TextInput style={styles.input} value={form.confirmPassword} onChangeText={(value) => update('confirmPassword', value)} placeholder="Повторите пароль" secureTextEntry />}</>}
                <PrimaryButton text={mode === 'login' ? 'Войти' : mode === 'smsLogin' ? 'Получить код' : mode === 'forgot' ? 'Получить код' : 'Зарегистрироваться'} onPress={submit} loading={loading} />
                {mode === 'login' && <><TouchableOpacity onPress={() => { resetError(); setMode('smsLogin'); }}><Text style={styles.link}>Войти без пароля по SMS</Text></TouchableOpacity><TouchableOpacity onPress={() => { resetError(); setMode('forgot'); }}><Text style={styles.link}>Забыли пароль?</Text></TouchableOpacity><TouchableOpacity onPress={() => { resetError(); setMode('register'); }}><Text style={styles.link}>Создать аккаунт</Text></TouchableOpacity></>}
                {mode !== 'login' && <TouchableOpacity onPress={() => { resetError(); setMode('login'); }}><Text style={styles.link}>Вернуться ко входу</Text></TouchableOpacity>}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PrimaryButton({ text, onPress, loading }) {
  return <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={onPress} disabled={loading}><Text style={styles.buttonText}>{loading ? 'Загрузка...' : text}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FB' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 22 },
  brand: { color: '#EC1B23', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 18 },
  title: { color: '#111', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#777', textAlign: 'center', marginBottom: 18 },
  error: { color: '#C62828', backgroundColor: '#FFF1F1', borderRadius: 8, padding: 10, marginBottom: 12, textAlign: 'center' },
  input: { height: 48, borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 10, paddingHorizontal: 14, marginTop: 10, color: '#111', backgroundColor: '#fff' },
  button: { height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EC1B23', marginTop: 16 },
  disabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontWeight: '800' },
  link: { color: '#EC1B23', textAlign: 'center', fontWeight: '700', marginTop: 16 },
});