import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { resetToAuth } from '../navigate';
import { API_URL } from '../config';

export default function SettingsScreen({ navigation }) {
  const [deleting, setDeleting] = useState(false);

  const openDocument = (type) => {
    navigation.navigate('DocumentViewer', { type });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удалить аккаунт',
      'Эта операция необратима. Все ваши данные будут удалены. Вы уверены?',
      [
        { text: 'Отмена', onPress: () => {}, style: 'cancel' },
        {
          text: 'Удалить',
          onPress: deleteAccountConfirmed,
          style: 'destructive',
        },
      ]
    );
  };

  const deleteAccountConfirmed = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('@accessToken')}`,
        },
      });
      if (res.ok) {
        await AsyncStorage.removeItem('@accessToken');
        await AsyncStorage.removeItem('@refreshToken');
        await AsyncStorage.removeItem('@currentUser');
        await AsyncStorage.removeItem('@currentRole');
        resetToAuth();
      } else {
        Alert.alert('Ошибка', 'Не удалось удалить аккаунт');
      }
    } catch (err) {
      console.error('delete account', err);
      Alert.alert('Ошибка', 'Ошибка при удалении аккаунта');
    } finally {
      setDeleting(false);
    }
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Ошибка', 'Не удалось открыть ссылку');
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Настройки</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Documents Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Документы</Text>

          <TouchableOpacity
            style={s.menuItem}
            onPress={() => openDocument('policy')}
          >
            <View style={s.menuItemLeft}>
              <Ionicons name="document-text" size={24} color="#EC1B23" />
              <View style={s.menuItemTextContainer}>
                <Text style={s.menuItemTitle}>Политика конфиденциальности</Text>
                <Text style={s.menuItemSubtitle}>Условия использования данных</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuItem}
            onPress={() => openDocument('rules')}
          >
            <View style={s.menuItemLeft}>
              <Ionicons name="document-text" size={24} color="#EC1B23" />
              <View style={s.menuItemTextContainer}>
                <Text style={s.menuItemTitle}>Правила сервиса</Text>
                <Text style={s.menuItemSubtitle}>Правила использования платформы</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuItem}
            onPress={() => openDocument('deletion')}
          >
            <View style={s.menuItemLeft}>
              <Ionicons name="document-text" size={24} color="#EC1B23" />
              <View style={s.menuItemTextContainer}>
                <Text style={s.menuItemTitle}>Удаление аккаунта</Text>
                <Text style={s.menuItemSubtitle}>Как удалить свой аккаунт</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* About App Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>О приложении</Text>

          <TouchableOpacity
            style={s.menuItem}
            onPress={() => navigation.navigate('AboutApp')}
          >
            <View style={s.menuItemLeft}>
              <Ionicons name="information-circle" size={24} color="#EC1B23" />
              <View style={s.menuItemTextContainer}>
                <Text style={s.menuItemTitle}>О проекте</Text>
                <Text style={s.menuItemSubtitle}>Информация о приложении</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuItem}
            onPress={() => openLink('tel:+77123456789')}
          >
            <View style={s.menuItemLeft}>
              <Ionicons name="call" size={24} color="#EC1B23" />
              <View style={s.menuItemTextContainer}>
                <Text style={s.menuItemTitle}>Позвонить в поддержку</Text>
                <Text style={s.menuItemSubtitle}>+7 (712) 345-67-89</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuItem}
            onPress={() => openLink('mailto:mywork.kz.app@gmail.com')}
          >
            <View style={s.menuItemLeft}>
              <Ionicons name="mail" size={24} color="#EC1B23" />
              <View style={s.menuItemTextContainer}>
                <Text style={s.menuItemTitle}>Написать письмо</Text>
                <Text style={s.menuItemSubtitle}>mywork.kz.app@gmail.com</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuItem}
            onPress={() => openLink('https://mywork.kz')}
          >
            <View style={s.menuItemLeft}>
              <Ionicons name="globe" size={24} color="#EC1B23" />
              <View style={s.menuItemTextContainer}>
                <Text style={s.menuItemTitle}>Посетить сайт</Text>
                <Text style={s.menuItemSubtitle}>https://mywork.kz</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Аккаунт</Text>

          <TouchableOpacity
            style={[s.menuItem, s.dangerItem]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <View style={s.menuItemLeft}>
              <Ionicons name="trash" size={24} color="#D32F2F" />
              <View style={s.menuItemTextContainer}>
                <Text style={[s.menuItemTitle, { color: '#D32F2F' }]}>
                  Удалить аккаунт
                </Text>
                <Text style={s.menuItemSubtitle}>
                  Безвозвратно удалить все данные
                </Text>
              </View>
            </View>
            {!deleting && <Ionicons name="chevron-forward" size={24} color="#CCC" />}
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={s.versionInfo}>
          <Text style={s.versionText}>Версия приложения: 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});
