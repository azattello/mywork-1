import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const Message = () => {
  const [messages, setMessages] = useState([
   
  ]);

  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: inputText, isSentByUser: true }]);
      setInputText('');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.name}>Алмаз</Text>
          <Text style={styles.status}>В сети 18 июль в 09:24</Text>
        </View>
        <View style={styles.messagesContainer}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isSentByUser ? styles.sentMessage : styles.receivedMessage,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.messagebuttonContainer}>
        <View ><Text style={styles.messagebutton}>Договорились</Text></View>
        <View ><Text style={styles.messagebutton}>Заказ выполнен</Text></View>
        <View ><Text style={styles.messagebutton}>Отменить</Text></View>
        </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Написать сообщение..."
          multiline
          value={inputText}
          onChangeText={setInputText}
        />
       
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Отправить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 80,
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
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '80%',
  },
  receivedMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e0e0e0',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e0e0e0',
  },
  messageText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#B23439',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messagebuttonContainer:{
    display:"flex",
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  messagebutton:{
    backgroundColor: "#000",
    color: '#fff',
    padding: 10,
    borderRadius: 10,
  }
});

export default Message;
