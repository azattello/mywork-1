import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const RequestMap = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Карта доступна в мобильном приложении</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F4F6', padding: 24 },
  title: { color: '#555', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});

export default RequestMap;