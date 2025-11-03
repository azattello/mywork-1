import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import Main from './components/Main';
import SplashScreen from "./components/SplashScreen";
import Role from "./components/role";
import Reg from "./components/Reg";
import Auth from "./components/Auth";

import Home from "./components/Home";
import Catalog from "./components/CatalogScreen";
import Add from "./components/AddScreen";
import Apps from "./components/AppsScreen";
import Account from "./components/AccountScreen";

import CatalogSpecial from "./components/catalogItems";
import CatalogService from "./components/catalogItems2";

import ActiveApps from "./components/activeApps";
import NoActiveApps from "./components/noActiveApps"
import Support from "./components/support";

import PostOpen from "./pro/PostOpen";

// PRO

import HomePro from "./pro/HomePro";
import CatalogScreenPro from "./pro/CatalogScreenPro";
import AddScreenPro from "./pro/AddScreenPro";
import AppsPro from "./pro/AppsScreenPro";
import AccountPro from "./pro/AccountScreenPro";

import CatalogServicePro from "./pro/catalogItemsPro2";
import ActiveAppsPro from "./pro/activeAppsPro";
import Offer from "./pro/Offer";
import Message from "./pro/Message";
import SpecialistProfile from "./pro/SpecialistProfile";
import rating from "./pro/rating";
import ViewAccount from "./components/viewAccount";
import ChatScreen from "./components/ChatScreen";
import FilterScreenPro from "./pro/FilterScreenPro";

const  Stack = createStackNavigator();


export default function Navigate() {
    return <NavigationContainer>

        <Stack.Navigator initialRouteName="SplashScreen">

            <Stack.Screen 
                name="SplashScreen" 
                component={SplashScreen} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="Role" 
                component={Role} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="Main" 
                component={Main} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="Auth" 
                component={Auth} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="Reg" 
                component={Reg} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="Home" 
                component={Home} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Catalog" 
                component={Catalog} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Add" 
                component={Add} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Apps" 
                component={Apps} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Account" 
                component={Account} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="HomePro" 
                component={HomePro} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="CatalogScreenPro" 
                component={CatalogScreenPro} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="AddScreenPro" 
                component={AddScreenPro} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="AppsPro" 
                component={AppsPro} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="AccountPro" 
                component={AccountPro} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="CatalogSpecial" 
                component={CatalogSpecial} 
                options={{headerShown: false }}
            />
          
            <Stack.Screen 
                name="CatalogService" 
                component={CatalogService} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="Support" 
                component={Support} 
                options={{headerShown: false }}
            />
          
            <Stack.Screen 
                name="ActiveApps" 
                component={ActiveApps} 
                options={{headerShown: false }}
            />
          
            <Stack.Screen 
                name="NoActiveApps" 
                component={NoActiveApps} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="CatalogServicePro" 
                component={CatalogServicePro} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="Заявка" 
                component={PostOpen} 
                options={{headerShown: false }}
            />

            <Stack.Screen 
                name="Предложение" 
                component={Offer} 
                options={{headerShown: false }}
            />
              <Stack.Screen 
                name="Сообщение" 
                component={Message} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Профиль" 
                component={SpecialistProfile} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Отзыв" 
                component={rating} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Исполнитель" 
                component={ViewAccount} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Чат" 
                component={ChatScreen} 
                options={{headerShown: false }}
            />
            <Stack.Screen 
                name="Фильтр" 
                component={FilterScreenPro} 
                options={{headerShown: false }}
            />



        </Stack.Navigator>



    </NavigationContainer>
}