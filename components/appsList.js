import React, { useState, useEffect } from 'react';
import { AppRegistry, TextInput, SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity} from 'react-native';


import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

export default function AppsList() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const currentUserRaw = await AsyncStorage.getItem('@currentUser');
                if (!currentUserRaw) return setData([]);
                let userId = null;
                try { const parsed = JSON.parse(currentUserRaw); userId = parsed?.id || parsed?._id || parsed?.userId || parsed?.uid || null; } catch(e) { userId = currentUserRaw; }
                if (!userId) return setData([]);
                const res = await axios.get(`${API_URL}/api/applications/user/${userId}`);
                if (res.data && res.data.success) setData(res.data.data || []);
                else setData([]);
            } catch (err) {
                console.error('Error fetching applications:', err);
                setData([]);
            }
        };

        fetchData();
    }, []);

    console.log(data)

};
	