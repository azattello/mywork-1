import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const SpecialistProfile = () => {
  return (
    <ScrollView style={styles.container}>
        <View style={styles.section}>
        <Text style={styles.title}>Инженер-программист Специалист</Text>
        <Text style={styles.price}>18 000 тнг</Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.name}>Алексей</Text>
        <Text style={styles.status}>В сети 29 июн в 09:24</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Отзывы специалистов</Text>
        <View style={styles.review}>
          <Text>Приятно общаться</Text>
          <Text>Оплата в срок</Text>
          <Text>Адекватные ожидания</Text>
          <Text>Всё как договаривались</Text>
          <Text style={styles.reviewer}>Дархан И. • 8 июня</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    color: '#666',
  },
  section: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  review: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  reviewer: {
    marginTop: 8,
    color: '#666',
  },
});

export default SpecialistProfile;
