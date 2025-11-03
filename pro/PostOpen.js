import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, FlatList} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import AppsList from './appsList';



export default function PostOpen({navigation}) {

  return (
   
  <ScrollView style={styles.container}>
  
  <View style={styles.detailsContainer}>
        <Text style={styles.title}>Инженер-программист Специалист</Text>
        <Text style={styles.price}>18 000 тнг Программисты</Text>
        <Text style={styles.sectionTitle}>Описание</Text>
        <Text style={styles.description}>
          Установка и настройка программного обеспечения. Разработка с нуля. Консультации и обучение по программированию. Опыт работы более 10 лет. Подготовка специалистов в области технического обслуживания и ремонта оборудования.
        </Text>
        <Text style={styles.sectionTitle}>Дистанционно</Text>
        <Text style={styles.sectionTitle}>Адрес</Text>
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2906.528960108566!2d76.90324087508381!3d43.24033467903749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3883693a65a69929%3A0x2e9b4e3bcced1a8f!2sGlobus!5e0!3m2!1sru!2skz!4v1723195644830!5m2!1sru!2skz" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        <Text style={styles.details}>Алматы (МСК+3)</Text>
        <Text style={styles.sectionTitle}>Когда</Text>
        <Text style={styles.details}>начать: 5 июля (пт)</Text>
        <Text style={styles.sectionTitle}>Заказ № 12345678</Text>
        <Text style={styles.details}>Заказ оставлен 30 июн в 12:00</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Алексей</Text>
          <Text style={styles.userStatus}>В сети 30 июн в 14:00</Text>
          <Ionicons name="thumbs-up" size={16} color="#000" />
        </View>
        <Text style={styles.note}>В этом заказе ваш отклик будет 1-м по рейтингу.</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => alert('Написать клиенту')}>
        <Text style={styles.buttonText}>Написать клиенту</Text>
      </TouchableOpacity>
      <Text style={styles.similarOrdersTitle}>Похожие заказы</Text>
      <View style={styles.similarOrder}>
        <Text style={styles.similarOrderTitle}>Разработка на Python</Text>
        <Text style={styles.similarOrderDetails}>Программирование веб-приложений. Фреймворк: Django...</Text>
        <Text style={styles.similarOrderDetails}>Дистанционно. Алматы</Text>
        <Text style={styles.similarOrderDetails}>10 июл. (Пн) 18:00</Text>
      </View>
    <View style={styles.area}></View>
  </ScrollView>
);
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 20,
  backgroundColor: '#F2F2F2',
},
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},
detailsContainer: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  shadowColor: "#888",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 1,
  elevation: 5,
},
title: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
},
price: {
  fontSize: 16,
  color: '#888',
  marginBottom: 20,
},
sectionTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  marginTop: 20,
},
description: {
  fontSize: 14,
  color: '#333',
  marginTop: 10,
},
details: {
  fontSize: 14,
  color: '#333',
  marginTop: 10,
},
userInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 20,
},
userName: {
  fontSize: 14,
  fontWeight: 'bold',
  marginRight: 10,
},
userStatus: {
  fontSize: 14,
  color: '#888',
  marginRight: 10,
},
note: {
  fontSize: 14,
  color: '#888',
  marginTop: 20,
},
button: {
  backgroundColor: '#B23439',
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 20,
},
buttonText: {
  color: '#fff',
  fontSize: 16,
},
similarOrdersTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginTop: 30,
  marginBottom: 10,
},
similarOrder: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  shadowColor: "#888",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 1,
  elevation: 5,
  marginTop: 10,
},
similarOrderTitle: {
  fontSize: 16,
  fontWeight: 'bold',
},
similarOrderDetails: {
  fontSize: 14,
  color: '#333',
  marginTop: 5,
},
area:{
  height: 30,
}
});