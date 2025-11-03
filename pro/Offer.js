import React from 'react';
import { View, Text, StyleSheet, Button, TextInput, TouchableOpacity} from 'react-native';

const Offer = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>Алексей</Text>
      <Text style={styles.status}>В сети 29 июн в 09:24</Text>
      <Text style={styles.title}>Инженер-программист Специалист</Text>
      <Text style={styles.price}>18 000 тнг</Text>
      <Text style={styles.label}>Стоимость услуги *</Text>
      <View style={styles.priceContainer}>
        <TextInput style={styles.priceInput} placeholder="от" />
        <TextInput style={styles.priceInput} placeholder="до" />
      </View>
      <TextInput style={styles.textInput} placeholder="Указать точную стоимость" />
      <Text style={styles.label}>Предложение или вопрос клиенту</Text>
      <TextInput style={styles.textArea} placeholder="Расскажите о своём опыте..." multiline />

      <TouchableOpacity style={styles.button} onPress={() => alert('Откликнуться')}>
        <Text style={styles.buttonText}>Откликнуться</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex:1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    color: '#666',
  },
  title: {
    fontSize: 18,
    marginTop: 8,
  },
  price: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  priceInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    marginRight: 8,
    padding: 8,
    borderRadius: 4,
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  textArea: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
    height: 100,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#B23439',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,

    position: 'fixed',
    top: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Offer;
