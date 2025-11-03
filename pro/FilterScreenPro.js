import React, { useState } from 'react';
import { View, Text, Switch, TextInput, TouchableOpacity, StyleSheet, Pressable } from 'react-native';

const FilterScreenPro = () => {
  const [checked, setChecked] = useState('new'); // Состояние для радио кнопок
  const [freeOrdersOnly, setFreeOrdersOnly] = useState(false); // Состояние для свича
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  return (
    <View style={styles.container}>
      {/* Фильтр заказов */}
      <Text style={styles.sectionTitle}>Фильтр заказов</Text>

        <Text style={styles.label}>Место встречи</Text>
      <View style={styles.row}>
        <Text style={styles.value}>У специалиста</Text>
        <Text style={styles.value}>У клиента</Text>
        <Text style={styles.value}>Дистанционно</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Ставка, тнг</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="от"
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
          />
          <Text style={styles.dash}>—</Text>
          <TextInput
            style={styles.input}
            placeholder="до"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text>Только заказы с бесплатным откликом</Text>
        <Switch
          value={freeOrdersOnly}
          onValueChange={setFreeOrdersOnly}
        />
      </View>

      {/* Сортировка заказов */}
      <Text style={styles.sectionTitle}>Сортировка заказов</Text>

      <View style={styles.radioButtonRow}>
        <Pressable
          style={[styles.radioButtonOuter, checked === 'new' && styles.radioButtonOuterChecked]}
          onPress={() => setChecked('new')}
        >
          {checked === 'new' && <View style={styles.radioButtonInner} />}
        </Pressable>
        <Text style={styles.radioButtonText}>Сначала новые</Text>
      </View>

      <View style={styles.radioButtonRow}>
        <Pressable
          style={[styles.radioButtonOuter, checked === 'viewed' && styles.radioButtonOuterChecked]}
          onPress={() => setChecked('viewed')}
        >
          {checked === 'viewed' && <View style={styles.radioButtonInner} />}
        </Pressable>
        <Text style={styles.radioButtonText}>Сначала просмотренные</Text>
      </View>

      {/* Кнопка */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Показать 28 заказов</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#000',
    padding: 10,
    backgroundColor: "#dedede",
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  input: {
    width: 80,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlign: 'center',
  },
  dash: {
    marginHorizontal: 10,
    fontSize: 18,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  radioButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  radioButtonOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioButtonOuterChecked: {
    borderColor: '#000',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  radioButtonText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default FilterScreenPro;
