import { StatusBar } from 'expo-status-bar';
import { AppRegistry, SafeAreaView, Image ,StyleSheet, Text, View, ScrollView, Button, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function Role({navigation}) {
    
    const Auth = async ()=>{
        try {
            await AsyncStorage.setItem('@currentRole', 'client');
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
        }
        navigation.navigate('Auth');
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
        <Text style={styles.roleTitle}>Выберите роль</Text>
        <Text style={styles.roleSubtitle}>Как вы будете использовать приложение?</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={Auth}>
            <Text style={styles.primaryButtonText}>Ищу специалиста</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={Auth2}>
            <Text style={styles.secondaryButtonText}>Я специалист</Text>
        </TouchableOpacity>

    </View>
  
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F8FB',
        paddingHorizontal: 24,
    },
    logo: {
        width: 240,
        height: 100,
        marginBottom: 18,
        borderRadius: 8,
        resizeMode: 'contain'
    },
    roleTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222',
        marginTop: 6,
        textAlign: 'center'
    },
    roleSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 6,
        textAlign: 'center',
        marginBottom: 16
    },
    primaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#EC1B23',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: '#EC1B23',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600'
    },
    secondaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#fff',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#EC1B23'
    },
    secondaryButtonText: {
        color: '#EC1B23',
        fontWeight: '600'
    }

});
