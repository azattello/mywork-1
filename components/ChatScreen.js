import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const chats = [
  { id: '1', name: 'Индира', date: '11 июл', message: 'Как прошёл звонок — договорились о р...', status: 'Вы откликнулись', statusColor: 'orange' },
  { id: '2', name: 'Маншук', date: '26 июн', message: 'Контакты клиента: Маншук +777722...', status: 'Вы откликнулись', statusColor: 'orange' },
  { id: '3', name: 'Мадина', date: '24 июн', message: 'Давайте подробнее обсудим в ватсапе!', status: 'Клиент увидел отклик', statusColor: 'green' },
  { id: '4', name: 'Аймира', date: '24 июн', message: 'Ответьте на предложение клиента Пер...', status: 'Ответьте на предложение клиента', statusColor: 'green' },
  { id: '5', name: 'Аяулым', date: '20 июн', message: 'Здравствуйте, вам на ватсап написал', status: 'Клиенту интересно ваше предложение', statusColor: 'green' },
];

const ChatItem = ({ name, date, message, status, statusColor }) => (
  <TouchableOpacity style={styles.item}>
    <View style={[styles.avatar, { backgroundColor: getColor(name) }]}>
      <Text style={styles.avatarText}>{name[0]}</Text>
    </View>
    <View style={styles.details}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text numberOfLines={1} style={styles.message}>{message}</Text>
      <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
    </View>
  </TouchableOpacity>
);

const getColor = (name) => {
  // Simple function to assign a color based on the first letter of the name
  const char = name[0].toUpperCase();
  if (char >= 'A' && char <= 'G') return '#f5a623';
  if (char >= 'H' && char <= 'N') return '#50e3c2';
  if (char >= 'O' && char <= 'U') return '#9013fe';
  return '#b8e986';
}

const ChatScreen = () => (
  <View style={styles.container}>
    <FlatList
      data={chats}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <ChatItem 
          name={item.name} 
          date={item.date} 
          message={item.message} 
          status={item.status} 
          statusColor={item.statusColor} 
        />
      )}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  item: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: 'bold',
  },
  date: {
    color: '#888',
  },
  message: {
    color: '#555',
  },
  status: {
    marginTop: 5,
    fontSize: 12,
  },
});

export default ChatScreen;
