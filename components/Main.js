import React from 'react';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Клиент
import HomeCustomer from './HomeCustomer';
import Home from './Home';
import SpecialistsCatalogScreen from './SpecialistsCatalogScreen';
import CreateApplicationWizard from './CreateApplicationWizard';
import Apps from './AppsScreen';
import Account from './AccountScreen';
import MyApplicationsScreen from './MyApplicationsScreen';
import NotificationsScreen from './NotificationsScreen';

// Специалист
import HomePro from '../pro/HomePro';
import CatalogScreenPro from '../pro/CatalogScreenPro';
import AppsPro from '../pro/AppsScreenPro';
import AccountPro from '../pro/AccountScreenProFixed';
import SpecialistResponsesScreen from '../pro/SpecialistResponsesScreen';
import IncomingApplicationsScreen from './IncomingApplicationsScreen';

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
import ManageCategories from './ManageCategories';
import EditProfileScreen from './EditProfileScreen';
import SelectCityScreen from './SelectCityScreen';
import VerificationScreen from './VerificationScreen';
import ReviewsScreen from './ReviewsScreen';
import OrdersHistoryScreen from './OrdersHistoryScreen';
import ResponsesViewScreen from './ResponsesViewScreen';
import SpecialistProfileView from './SpecialistProfileView';
import AvailableApplicationsScreen from './AvailableApplicationsScreen';
import ApplicationDetailScreen from './ApplicationDetailScreen';
import ChatListScreen from './ChatListScreen';
import CategoriesListScreen from './CategoriesListScreen';
import CreateResponseWizard from './CreateResponseWizard';
import ReviewScreen from './ReviewScreen';
import SettingsScreen from './SettingsScreen';
import AboutAppScreen from './AboutAppScreen';
import DocumentViewerScreen from './DocumentViewerScreen';
import RequestMapFeedScreen from './request-map/RequestMapFeedScreen';

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
            case 'Создать заказ':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Чаты':
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              break;
            case 'Мои заявки':
              iconName = focused ? 'document' : 'document-outline';
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
      <Tab.Screen name="Главная" component={HomeCustomer} />
      <Tab.Screen name="Создать заказ" component={CreateApplicationWizard} />
      <Tab.Screen name="Чаты" component={ChatListScreen} />
      <Tab.Screen name="Мои заявки" component={MyApplicationsScreen} />
      <Tab.Screen name="Аккаунт" component={Account} />
    </Tab.Navigator>
  );
}

function TabPro({ unreadChatsCount = 0 }) {
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
            case 'Входящие':
              iconName = focused ? 'mail' : 'mail-outline';
              break;
            case 'Чаты':
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              break;
            case 'Лента':
              iconName = focused ? 'flash' : 'flash-outline';
              break;
            case 'Карта заявок':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Аккаунт':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#EC1B23',
        tabBarInactiveTintColor: '#CA989A',
        tabBarLabel: route.name,
        tabBarBadge: route.name === 'Чаты' && unreadChatsCount > 0 ? unreadChatsCount : null,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Главная" component={HomePro} />
      <Tab.Screen name="Входящие" component={IncomingApplicationsScreen} />
      <Tab.Screen name="Чаты" component={ChatListScreen} />
      <Tab.Screen name="Лента" component={AvailableApplicationsScreen} />
      <Tab.Screen name="Карта заявок" component={RequestMapFeedScreen} />
      <Tab.Screen name="Аккаунт" component={AccountPro} />
    </Tab.Navigator>
  );
}

export default function Main({navigation}) {
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    const loadRole = async () => {
      try {
        // Сначала пробуем загрузить activeRole из сохраненного пользователя
        const currentUserStr = await AsyncStorage.getItem('@currentUser');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          const activeRole = currentUser.activeRole || currentUser.role || 'user';
          setRole(activeRole === 'specialist' ? 'specialist' : 'user');
        } else {
          // Fallback на старый метод
          const currentRole = await AsyncStorage.getItem('@currentRole');
          // Обрабатываем все варианты: 'specialist', 'profi', 'user', 'client'
          const normalizedRole = (currentRole === 'specialist' || currentRole === 'profi') ? 'specialist' : 'user';
          setRole(normalizedRole);
        }
      } catch (err) {
        console.error('Load role error', err);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };
    loadRole();
  }, []);

  // Слушаем глобальное обновление unreadChatsCount
  useEffect(() => {
    if (global.setUnreadChatsCount) {
      // Сохраняем оригинальную функцию если она была
      const originalSetUnreadChatsCount = global.setUnreadChatsCount;
      
      // Переопределяем чтобы обновить локальное состояние
      global.setUnreadChatsCount = (count) => {
        setUnreadChatsCount(count);
        if (originalSetUnreadChatsCount && typeof originalSetUnreadChatsCount === 'function') {
          originalSetUnreadChatsCount(count);
        }
      };
    }
  }, []);

  if (loading) {
    return null; // или LoadingScreen
  }

  return(
    <NavigationContainer independent={true} >
      <Stack.Navigator initialRouteName={role === 'specialist' ? 'TabPro' : 'TabNav'}>
        <Stack.Screen 
          name="TabNav" 
          component={TabNav} 
          options={{headerShown: false }}
        />
        <Stack.Screen 
          name="TabPro" 
          options={{headerShown: false }}
        >
          {() => <TabPro unreadChatsCount={unreadChatsCount} />}
        </Stack.Screen>
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
          name={'Управление категориями'}
          component={ManageCategories}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'EditProfile'}
          component={EditProfileScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'SelectCity'}
          component={SelectCityScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'Verification'}
          component={VerificationScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'Reviews'}
          component={ReviewsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'OrdersHistory'}
          component={OrdersHistoryScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'CreateApplication'}
          component={CreateApplicationWizard}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'CreateResponse'}
          component={CreateResponseWizard}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'ResponsesView'}
          component={ResponsesViewScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'SpecialistProfileView'}
          component={SpecialistProfileView}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'AvailableApplications'}
          component={AvailableApplicationsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'RequestMapFeed'}
          component={RequestMapFeedScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'AvailableApplicationsScreen'}
          component={AvailableApplicationsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'CategoriesList'}
          component={CategoriesListScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'CategoriesListScreen'}
          component={CategoriesListScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'SpecialistsCatalog'}
          component={SpecialistsCatalogScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'ApplicationDetail'}
          component={ApplicationDetailScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'ApplicationDetailScreen'}
          component={ApplicationDetailScreen}
          options={{headerShown: false}}
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
          name={'ChatScreen'}
          component={ChatScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'ReviewScreen'}
          component={ReviewScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'Фильтр'}
          component={FilterScreenPro}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Уведомления'}
          component={NotificationsScreen}
          oprions={{headerShown: false}}
        />
        <Stack.Screen
          name={'Settings'}
          component={SettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'AboutApp'}
          component={AboutAppScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name={'DocumentViewer'}
          component={DocumentViewerScreen}
          options={{headerShown: false}}
        />
        
       
      </Stack.Navigator>
    </NavigationContainer>
  )
}

