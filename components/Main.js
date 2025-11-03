import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Клиент
import Home from './Home';
import Catalog from './CatalogScreen';
import Add from './AddScreen';
import Apps from './AppsScreen';
import Account from './AccountScreen';

// Специалист
import HomePro from '../pro/HomePro';
import CatalogScreenPro from '../pro/CatalogScreenPro';
import AddScreenPro from '../pro/AddScreenPro';
import AppsPro from '../pro/AppsScreenPro';
import AccountPro from '../pro/AccountScreenPro';

// Общие экраны
import Support from './support';
import Cities from './Cities';
import SplashScreen from './SplashScreen';
import Reg from './Reg';
import Offer from '../pro/Offer';
import Message from '../pro/Message';
import SpecialistProfile from '../pro/SpecialistProfile';
import rating from '../pro/rating';
import ViewAccount from './viewAccount';
import ChatScreen from './ChatScreen';
import FilterScreenPro from '../pro/FilterScreenPro';
import PostOpen from '../pro/PostOpen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNav() {
  return (
    <Tab.Navigator
      initialRouteName="Главная"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Главная':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Каталог':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Создать':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Заявки':
              iconName = focused ? 'layers' : 'layers-outline';
              break;
            case 'Аккаунт':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#EC1B23',
        tabBarInactiveTintColor: '#CA989A',
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 3,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Главная" component={Home} />
      <Tab.Screen name="Каталог" component={Catalog} />
      <Tab.Screen name="Создать" component={Add} />
      <Tab.Screen name="Заявки" component={Apps} />
      <Tab.Screen name="Аккаунт" component={Account} />
    </Tab.Navigator>
  );
}

function TabPro() {
  return (
    <Tab.Navigator
      initialRouteName="Главная"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Главная':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Каталог':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Лента':
              iconName = focused ? 'flash' : 'flash-outline';
              break;
            case 'Отклики':
              iconName = focused ? 'layers' : 'layers-outline';
              break;
            case 'Аккаунт':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#EC1B23',
        tabBarInactiveTintColor: '#CA989A',
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 3,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Главная" component={HomePro} />
      <Tab.Screen name="Каталог" component={CatalogScreenPro} />
      <Tab.Screen name="Лента" component={AddScreenPro} />
      <Tab.Screen name="Отклики" component={AppsPro} />
      <Tab.Screen name="Аккаунт" component={AccountPro} />
    </Tab.Navigator>
  );
}

export default function Main({navigation}) {
  return(
    <NavigationContainer independent={true} >
      <Stack.Navigator initialRouteName="TabNav">
        <Stack.Screen 
          name="TabNav" 
          component={TabNav} 
          options={{headerShown: false }}
        />
        <Stack.Screen 
          name="TabPro" 
          component={TabPro} 
          options={{headerShown: false }}
        />
        <Stack.Screen
          name={'Служба поддержки'}
          component={Support}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Ваш город'}
          component={Cities}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'SplashScreen'}
          component={SplashScreen}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Заявка'}
          component={PostOpen}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Предложение'}
          component={Offer}
          oprions={{headerShown: false}}
        />
          <Stack.Screen
          name={'Сообщение'}
          component={Message}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Профиль'}
          component={SpecialistProfile}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Отзыв'}
          component={rating}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Исполнитель'}
          component={ViewAccount}
          oprions={{headerShown: false}}
        />
         <Stack.Screen
          name={'Чат'}
          component={ChatScreen}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Фильтр'}
          component={FilterScreenPro}
          oprions={{headerShown: false}}
        />
        
       
      </Stack.Navigator>
    </NavigationContainer>
  )
}

