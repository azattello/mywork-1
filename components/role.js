import { StatusBar } from 'expo-status-bar';
import { AppRegistry, SafeAreaView, Image ,StyleSheet, Text, View, ScrollView, Button, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function Role({navigation}) {
    
    const Auth = async ()=>{
        navigation.navigate('Auth');
        try {
            await AsyncStorage.setItem('@currentRole', 'client');
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
        }
        navigation.navigate('Auth')
    }

    const Auth2 = async ()=>{
        try {
            await AsyncStorage.setItem('@currentRole', 'profi');
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
        }
        navigation.navigate('Auth');
    }
   

  return (

     <View style={styles.container}>
        <StatusBar style="auto" />
        <Image
        style={styles.logo}
        source={require('../assets/logo.png')}
        />

        <TouchableOpacity style={styles.button} onPress={Auth}>
            <Text style={styles.buttonText}>Ищу специалиста</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={Auth2}>
            <Text style={styles.buttonText}>Я специалист</Text>
        </TouchableOpacity>

       
    </View>
  
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 50,

    },
    logo: {
        width: 200,
        height: 150,
        marginTop: 300,
        marginBottom: 50,
    },  
    button: {
        width: '100%',
        height: 60,
        borderColor: '#EC1B23',
        borderWidth: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,

    },
    buttonText: {
        color: '#EC1B23'
    },  

});
