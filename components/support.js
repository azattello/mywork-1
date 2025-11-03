import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function Support({navigation}) {

  return (
    <SafeAreaView style={styles.wrapper}>
    <StatusBar
      backgroundColor="#fff"
    />
      <Text>Поддержка</Text>        
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
wrapper:{
  display: 'flex',
  flex: 1,
  backgroundColor: '#F2F2F2',
  alignItems: 'center',
  justifyContent: 'center',
},


});
