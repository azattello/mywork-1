import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../utils/apiClient';
// Mode and CommMode removed — workMode implemented inline
import { Toast } from '../utils/ToastManager';

export default function CreateApplicationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: '',
    info: '',
    budgetType: 'fixed',
    summ: '',
    budgetMin: '',
    budgetMax: '',
    city: '',
    categories: [],
    address: '',
    deadline: '',
    workMode: 'online', // 'online' or 'offline'
  });

  const [modals, setModals] = useState({ city: false, categories: false });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(null);

  useEffect(() => { loadInitial(); }, []);

  // When screen regains focus, reload city selection from AsyncStorage
  useFocusEffect(
    useCallback(() => {
      const loadCityFromStorage = async () => {
        const cityId = await AsyncStorage.getItem('@city');
        if (cityId) {
          setForm((f) => ({ ...f, city: cityId }));
        }
      };
      loadCityFromStorage();
    }, [])
  );

  const loadInitial = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (userStr) setUser(JSON.parse(userStr));

      const citiesRes = await apiClient.request('get', '/api/cities');
      if (citiesRes.data && citiesRes.data.success) setCities(citiesRes.data.data || []);

      const catsRes = await apiClient.request('get', '/api/categories');
      if (catsRes.data && catsRes.data.success) setCategories(catsRes.data.data || []);
    } catch (err) {
      console.error(err);
      Toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const openCityChooser = () => navigation.navigate('Ваш город');

  const toggleCategory = (cat) => {
    const exists = form.categories.includes(cat._id);
    setForm((f) => ({ ...f, categories: exists ? f.categories.filter((c) => c !== cat._id) : [...f.categories, cat._id] }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'Введите название заказа';
    if (!form.city) return 'Выберите город';
    if (form.categories.length === 0) return 'Выберите хотя бы одну категорию';
    if (form.budgetType === 'fixed') {
      if (!form.summ || isNaN(form.summ)) return 'Введите корректный фиксированный бюджет';
    } else {
      if (!form.budgetMin || !form.budgetMax || isNaN(form.budgetMin) || isNaN(form.budgetMax)) return 'Введите корректный диапазон бюджета';
      if (parseFloat(form.budgetMin) > parseFloat(form.budgetMax)) return 'Минимальный бюджет не может быть больше максимального';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return Toast.error(err);
    setSubmitting(true);
    try {
      let parsedDeadline;
      if (form.deadline) {
        const m = form.deadline.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (m) {
          const day = parseInt(m[1], 10);
          const month = parseInt(m[2], 10) - 1;
          const year = parseInt(m[3], 10);
          const dt = new Date(year, month, day);
          if (!isNaN(dt.getTime())) parsedDeadline = dt.toISOString();
        }
      }

      const payload = {
        title: form.title.trim(),
        info: form.info.trim() || undefined,
        summ: form.budgetType === 'fixed' ? parseFloat(form.summ) : undefined,
        budgetMin: form.budgetType === 'range' ? parseFloat(form.budgetMin) : undefined,
        budgetMax: form.budgetType === 'range' ? parseFloat(form.budgetMax) : undefined,
        city: form.city,
        categories: form.categories,
        address: form.address || undefined,
        deadline: parsedDeadline || undefined,
        budgetType: form.budgetType,
        workMode: form.workMode,
        userID: user?._id,
      };

      const res = await apiClient.request('post', '/api/applications', payload);
      if (res.data && res.data.success) {
        Toast.success('Заказ создан');
        navigation.goBack();
      } else {
        Toast.error(res.data?.message || 'Не удалось создать заказ');
      }
    } catch (err) {
      console.error(err);
      Toast.error('Ошибка при создании заказа');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#EC1B23" /></SafeAreaView>
  );

  const selectedCityName = cities.find(c => c._id === form.city)?.name || 'Не выбран';
  const selectedCatsCount = form.categories.length;

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Создать заказ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.cityRow} onPress={openCityChooser}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text style={styles.cityText}>{selectedCityName}</Text>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <View style={styles.workModeRow}>
          <Text style={{fontWeight:'700', marginBottom:8}}>Режим выполнения</Text>
          <View style={{flexDirection:'row'}}>
            <TouchableOpacity style={[styles.modeBtn, form.workMode==='online' && styles.modeBtnActive]} onPress={()=>setForm({...form,workMode:'online'})}>
              <Text style={form.workMode==='online'?styles.modeBtnTextActive:styles.modeBtnText}>Онлайн</Text>
            </TouchableOpacity>
            <View style={{width:8}} />
            <TouchableOpacity style={[styles.modeBtn, form.workMode==='offline' && styles.modeBtnActive]} onPress={()=>setForm({...form,workMode:'offline'})}>
              <Text style={form.workMode==='offline'?styles.modeBtnTextActive:styles.modeBtnText}>Офлайн</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Название *</Text>
          <TextInput style={styles.input} placeholder="Краткий заголовок" value={form.title} onChangeText={(t)=>setForm({...form,title:t})} />

          <Text style={styles.label}>Описание</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="Подробно опишите задачу" value={form.info} onChangeText={(t)=>setForm({...form,info:t})} multiline numberOfLines={5} />

          <Text style={styles.label}>Бюджет</Text>
          <View style={styles.budgetRow}>
            <TouchableOpacity style={[styles.budgetBtn, form.budgetType==='fixed'&&styles.budgetBtnActive]} onPress={()=>setForm({...form,budgetType:'fixed'})}>
              <Text style={form.budgetType==='fixed'?styles.budgetBtnTextActive:styles.budgetBtnText}>Фикс</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.budgetBtn, form.budgetType==='range'&&styles.budgetBtnActive]} onPress={()=>setForm({...form,budgetType:'range'})}>
              <Text style={form.budgetType==='range'?styles.budgetBtnTextActive:styles.budgetBtnText}>Диапазон</Text>
            </TouchableOpacity>
          </View>

          {form.budgetType==='fixed' ? (
            <TextInput style={styles.input} placeholder="100000" keyboardType="decimal-pad" value={form.summ} onChangeText={(t)=>setForm({...form,summ:t})} />
          ) : (
            <View style={{flexDirection:'row'}}>
              <TextInput style={[styles.input,{flex:1,marginRight:8}]} placeholder="Мин" keyboardType="decimal-pad" value={form.budgetMin} onChangeText={(t)=>setForm({...form,budgetMin:t})} />
              <TextInput style={[styles.input,{flex:1}]} placeholder="Макс" keyboardType="decimal-pad" value={form.budgetMax} onChangeText={(t)=>setForm({...form,budgetMax:t})} />
            </View>
          )}

          <Text style={styles.label}>Адрес</Text>
          <TextInput style={styles.input} placeholder="Улица, дом" value={form.address} onChangeText={(t)=>setForm({...form,address:t})} />

          <Text style={styles.label}>Срок</Text>
          <TouchableOpacity style={styles.input} onPress={()=>setShowDatePicker(true)}>
            <Text style={{color: form.deadline? '#000' : '#999'}}>{form.deadline || 'Выберите дату'}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker value={dateValue||new Date()} mode="date" display="default" onChange={(e,d)=>{setShowDatePicker(false); if(d){ setDateValue(d); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); setForm({...form,deadline:`${dd}.${mm}.${yyyy}`}); }}} />
          )}

          <Text style={styles.label}>Категории ({selectedCatsCount})</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={()=>setModals({...modals,categories:true})}>
            <Text style={styles.selectBtnText}>{selectedCatsCount>0?`Выбрано ${selectedCatsCount}`:'Выберите категории'}</Text>
            <Ionicons name="chevron-down" size={18} color="#EC1B23"/>
          </TouchableOpacity>
        </View>

        <View style={{height:24}} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Опубликовать</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={modals.categories} animationType="slide">
        <SafeAreaView style={{flex:1}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={()=>setModals({...modals,categories:false})}><Ionicons name="close" size={24} color="#000"/></TouchableOpacity>
            <Text style={{fontWeight:'700'}}>Выберите категории</Text>
            <View style={{width:24}}/>
          </View>
          <FlatList data={categories} keyExtractor={i=>i._id} renderItem={({item})=>{
            const active = form.categories.includes(item._id);
            return (
              <TouchableOpacity style={[styles.catItem, active&&{backgroundColor:'#FFF0F0'}]} onPress={()=>toggleCategory(item)}>
                <Text style={{flex:1}}>{item.name}</Text>
                {active && <Ionicons name="checkmark" size={20} color="#EC1B23"/>}
              </TouchableOpacity>
            )
          }} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper:{flex:1,backgroundColor:'#F7F7F7'},
  header:{height:56,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,borderBottomWidth:1,borderColor:'#EEE'},
  headerTitle:{fontSize:16,fontWeight:'700'},
  content:{padding:16},
  cityRow:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',padding:12,borderRadius:10,marginBottom:12},
  cityText:{flex:1,marginLeft:8,color:'#333'},
  card:{backgroundColor:'#fff',borderRadius:10,padding:12},
  label:{fontSize:13,fontWeight:'600',marginTop:10,color:'#333'},
  input:{borderWidth:1,borderColor:'#E8E8E8',borderRadius:8,padding:10,marginTop:8,backgroundColor:'#fff'},
  multiline:{minHeight:100,textAlignVertical:'top'},
  budgetRow:{flexDirection:'row',marginTop:8},
  budgetBtn:{flex:1,padding:8,alignItems:'center',borderWidth:1,borderColor:'#EEE',borderRadius:8,backgroundColor:'#fff'},
  budgetBtnActive:{backgroundColor:'#EC1B23',borderColor:'#EC1B23'},
  budgetBtnText:{color:'#333',fontWeight:'600'},
  budgetBtnTextActive:{color:'#fff',fontWeight:'600'},
  selectBtn:{marginTop:8,padding:12,borderRadius:8,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:'#E8E8E8'},
  selectBtnText:{color:'#333'},
  footer:{padding:12,backgroundColor:'#fff',borderTopWidth:1,borderColor:'#EEE'},
  submitBtn:{backgroundColor:'#EC1B23',padding:14,borderRadius:10,alignItems:'center'},
  submitText:{color:'#fff',fontWeight:'700'},
  center:{flex:1,justifyContent:'center',alignItems:'center'},
  modalHeader:{height:56,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,borderBottomWidth:1,borderColor:'#EEE'},
  workModeRow:{marginBottom:12},
  modeBtn:{paddingVertical:8,paddingHorizontal:14,borderWidth:1,borderColor:'#E8E8E8',borderRadius:8,backgroundColor:'#fff'},
  modeBtnActive:{backgroundColor:'#EC1B23',borderColor:'#EC1B23'},
  modeBtnText:{color:'#333',fontWeight:'600'},
  modeBtnTextActive:{color:'#fff',fontWeight:'600'},
  catItem:{padding:12,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#F0F0F0'}
});
