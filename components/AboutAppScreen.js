import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function AboutAppScreen({ navigation }) {
  const openLink = (url) => {
    Linking.openURL(url);
  };

  const openEmail = () => {
    Linking.openURL('mailto:mywork.kz.app@gmail.com');
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>О проекте</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* App Logo/Title */}
        <View style={s.logoSection}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>M</Text>
          </View>
          <Text style={s.appName}>mywork</Text>
          <Text style={s.appSubtitle}>Платформа услуг и работы</Text>
          <Text style={s.version}>v1.0.0</Text>
        </View>

        {/* Description */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>О платформе</Text>
          <Text style={s.descriptionText}>
            mywork — это современная платформа, которая соединяет заказчиков и специалистов в различных сферах услуг. Мы помогаем вам легко найти нужного мастера или получить новых клиентов для вашего бизнеса.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Контактная информация</Text>

          <View style={s.contactItem}>
            <Ionicons name="location" size={24} color="#EC1B23" />
            <View style={s.contactText}>
              <Text style={s.contactLabel}>Юридический адрес</Text>
              <Text style={s.contactValue}>г. Каскелен, улица Булакты 16</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.contactItem}
            onPress={openEmail}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={24} color="#EC1B23" />
            <View style={s.contactText}>
              <Text style={s.contactLabel}>Email</Text>
              <Text style={s.contactValue}>mywork.kz.app@gmail.com</Text>
            </View>
            <Ionicons name="open" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.contactItem}
            onPress={() => openLink('https://mywork.kz')}
            activeOpacity={0.7}
          >
            <Ionicons name="globe" size={24} color="#EC1B23" />
            <View style={s.contactText}>
              <Text style={s.contactLabel}>Веб-сайт</Text>
              <Text style={s.contactValue}>https://mywork.kz</Text>
            </View>
            <Ionicons name="open" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Возможности</Text>

          <View style={s.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={s.featureText}>Создавайте заказы и получайте отклики от специалистов</Text>
          </View>

          <View style={s.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={s.featureText}>Просматривайте профили и портфолио мастеров</Text>
          </View>

          <View style={s.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={s.featureText}>Оставляйте отзывы и рейтинги</Text>
          </View>

          <View style={s.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={s.featureText}>Общайтесь с заказчиками и специалистами в приложении</Text>
          </View>

          <View style={s.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={s.featureText}>Безопасные платежи и сделки</Text>
          </View>
        </View>

        {/* Legal */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Правовая информация</Text>
          <Text style={s.legalText}>
            © 2026 mywork. Все права защищены. Использование платформы означает согласие с нашей Политикой конфиденциальности и Правилами сервиса.
          </Text>
        </View>

        {/* Support Section */}
        <View style={s.supportSection}>
          <Text style={s.supportTitle}>Нужна помощь?</Text>
          <Text style={s.supportText}>
            Если у вас есть вопросы или предложения, свяжитесь с нами по электронной почте.
          </Text>
          <TouchableOpacity
            style={s.supportButton}
            onPress={openEmail}
          >
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={s.supportButtonText}>Написать нам</Text>
          </TouchableOpacity>
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EC1B23',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  version: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  contactText: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  legalText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  supportSection: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  supportButton: {
    flexDirection: 'row',
    backgroundColor: '#EC1B23',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  supportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
