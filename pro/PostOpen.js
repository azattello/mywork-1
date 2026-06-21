import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import {
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios/dist/axios.min.js';
import { API_URL } from '../config';

// Для удобства разработки: включите mockMode = true чтобы фронтенд работал
// без реального бэкенда. Поменяйте на false когда сервер доступен.
const mockMode = true;

// Простой локальный эмулятор сокета (pub/sub внутри компонента)
function createLocalSocket() {
  const listeners = {};
  return {
    on: (event, cb) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    },
    off: (event, cb) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== cb);
    },
    emit: (event, data) => {
      (listeners[event] || []).forEach(cb => cb(data));
    }
  };
}

export default function PostOpen({ route, navigation }) {
  const [application, setApplication] = useState(null);
  const [responses, setResponses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Инициализация mock-сокета и мок-данных
  useEffect(() => {
    if (mockMode) {
      socketRef.current = createLocalSocket();
      // Подписка на "newMessage" и "statusUpdate"
      socketRef.current.on('newMessage', (m) => {
        setMessages(prev => [...prev, m]);
      });
      socketRef.current.on('statusUpdate', (s) => {
        setApplication(prev => ({ ...prev, status: s }));
      });
    }

    loadAll();

    return () => {
      if (socketRef.current && socketRef.current.off) {
        socketRef.current.off('newMessage');
        socketRef.current.off('statusUpdate');
      }
    };
  }, []);

  // Загрузка всех данных (mock или реальный API)
  async function loadAll() {
    setLoading(true);
    try {
      if (mockMode) {
        // Простые mock-данные
        const mockApp = {
          _id: 'app_1',
          title: 'Инженер-программист Специалист',
          price: '18 000 тнг',
          description: 'Установка и настройка ПО, разработка с нуля, консультации.',
          city: 'Алматы',
          date: '5 июля',
          orderNumber: '12345678',
          createdAt: '2025-06-30T12:00:00Z',
          user: { name: 'Алексей' },
          status: 'open'
        };

        const mockResponses = [
          { _id: 'r1', specialist: { name: 'Иван' }, message: 'Могу сделать за 15000', price: 15000, status: 'pending' },
          { _id: 'r2', specialist: { name: 'Мария' }, message: 'Готова завтра', price: 18000, status: 'pending' }
        ];

        const mockMessages = [
          { _id: 'm1', senderName: 'Иван', text: 'Здравствуйте, условия уточнить?', createdAt: new Date().toISOString() }
        ];

        // Имитация задержки
        await new Promise(r => setTimeout(r, 300));
        setApplication(mockApp);
        setResponses(mockResponses);
        setMessages(mockMessages);
      } else {
        // Реальный API (оставляем базовый каркас, если подключите later)
        const { applicationId } = route.params || {};
        const token = await AsyncStorage.getItem('token');
        const appRes = await axios.get(`${API_URL}/applications/${applicationId}`, { headers: { Authorization: `Bearer ${token}` } });
        const responsesRes = await axios.get(`${API_URL}/applications/${applicationId}/responses`, { headers: { Authorization: `Bearer ${token}` } });
        const chatRes = await axios.get(`${API_URL}/applications/${applicationId}/chat`, { headers: { Authorization: `Bearer ${token}` } });
        setApplication(appRes.data);
        setResponses(responsesRes.data);
        setMessages(chatRes.data.messages || chatRes.data);
      }
    } catch (error) {
      console.error('Load error', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }

  // Мок: отправка сообщения
  async function sendMessage() {
    if (!newMessage.trim()) return;
    const msg = { _id: `m_${Date.now()}`, senderName: 'Вы', text: newMessage.trim(), createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');

    // эмулируем ответ специалиста через 2 секунды
    if (mockMode) {
      setTimeout(() => {
        const reply = { _id: `m_${Date.now()+1}`, senderName: 'Иван', text: 'Принял, отпишите детали', createdAt: new Date().toISOString() };
        // отправляем через локальный сокет чтобы сработала подписка
        socketRef.current && socketRef.current.emit('newMessage', reply);
      }, 2000);
    } else {
      try {
        const token = await AsyncStorage.getItem('token');
        await axios.post(`${API_URL}/applications/${application._id}/chat`, { text: msg.text }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        console.error('Send message error', err);
      }
    }
  }

  // Мок: изменить статус заявки
  async function updateStatus(newStatus) {
    if (mockMode) {
      setApplication(prev => ({ ...prev, status: newStatus }));
      // оповестим подписчиков
      socketRef.current && socketRef.current.emit('statusUpdate', newStatus);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/applications/${application._id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setApplication(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Status update error', err);
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    }
  }

  // Мок: принять отклик
  async function acceptResponse(responseId) {
    if (mockMode) {
      setResponses(prev => prev.map(r => r._id === responseId ? { ...r, status: 'accepted' } : r));
      updateStatus('in_progress');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/applications/${application._id}/responses/${responseId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadAll();
    } catch (err) {
      console.error(err);
      Alert.alert('Ошибка', 'Не удалось принять отклик');
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{application.title}</Text>
        <Text style={styles.price}>{application.price} Программисты</Text>
        <Text style={styles.sectionTitle}>Описание</Text>
        <Text style={styles.description}>{application.description}</Text>
        <Text style={styles.sectionTitle}>Город</Text>
        <Text style={styles.details}>{(application.city && (application.city.name || application.city))}</Text>
        <Text style={styles.sectionTitle}>Когда</Text>
        <Text style={styles.details}>{application.date}</Text>
        <Text style={styles.sectionTitle}>Заказ № {application.orderNumber}</Text>
        <Text style={styles.details}>Заказ оставлен {new Date(application.createdAt).toLocaleString()}</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{application.user.name}</Text>
          <Text style={styles.userStatus}>статус: {application.status}</Text>
          <Ionicons name="thumbs-up" size={16} color="#000" />
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Отклики</Text>
        {responses.map(r => (
          <View key={r._id} style={[styles.detailsContainer, { marginTop: 8 }]}>
            <Text style={{ fontWeight: 'bold' }}>{r.specialist.name}</Text>
            <Text>{r.message}</Text>
            <Text>Цена: {r.price}</Text>
            <Text>Статус: {r.status}</Text>
            {r.status !== 'accepted' && (
              <TouchableOpacity style={[styles.button, { marginTop: 8 }]} onPress={() => acceptResponse(r._id)}>
                <Text style={styles.buttonText}>Принять</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Чат</Text>
        <View style={{ maxHeight: 300 }}>
          {messages.map(m => (
            <View key={m._id} style={[styles.messageBox, m.senderName === 'Вы' ? styles.myMessage : styles.otherMessage]}>
              <Text style={styles.messageText}>{m.text}</Text>
              <Text style={styles.messageTime}>{new Date(m.createdAt).toLocaleTimeString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Введите сообщение..."
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Отправить</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Действия по заявке</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => updateStatus('in_progress')}>
            <Text style={styles.buttonText}>Начать</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#4CAF50' }]} onPress={() => updateStatus('completed')}>
            <Text style={styles.buttonText}>Завершить</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#888' }]} onPress={() => updateStatus('cancelled')}>
            <Text style={styles.buttonText}>Отменить</Text>
          </TouchableOpacity>
        </View>
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