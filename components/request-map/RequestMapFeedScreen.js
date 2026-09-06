import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCityName } from './map.service';
import { useRequestMap } from './useRequestMap';
import RequestMap from './RequestMap';

const RequestMapFeedScreen = ({ navigation, route }) => {
  const { categoryId, categoryName, searchQuery } = route.params || {};
  const [mode, setMode] = useState('list');
  const [searchText, setSearchText] = useState(searchQuery || '');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const filters = useMemo(() => ({ categoryId, searchQuery, searchText }), [categoryId, searchQuery, searchText]);
  const { applications, mappableApplications, loading, refreshing, error, reload } = useRequestMap(filters);

  const openApplication = (application) => {
    navigation.navigate('ApplicationDetail', { applicationId: application._id });
  };

  const renderApplication = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openApplication(item)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{item.summ || 0} ₸</Text>
      </View>
      {!!item.info && <Text style={styles.description} numberOfLines={2}>{item.info}</Text>}
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={15} color="#EC1B23" />
        <Text style={styles.meta} numberOfLines={1}>{item.address || getCityName(item.city)}</Text>
      </View>
      <TouchableOpacity style={styles.openButton} onPress={() => openApplication(item)}>
        <Text style={styles.openButtonText}>Открыть заявку</Text>
        <Ionicons name="arrow-forward" size={16} color="#EC1B23" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="document-text-outline" size={52} color="#D7D7D7" />
      <Text style={styles.emptyTitle}>{applications.length ? 'По выбранным фильтрам заявок не найдено' : 'Заявок пока нет'}</Text>
      {!applications.length && <Text style={styles.emptyText}>Попробуйте изменить поиск или категорию</Text>}
    </View>
  );

  if (error) {
    return <SafeAreaView style={styles.container}><View style={styles.empty}><Text style={styles.emptyTitle}>Не удалось загрузить заявки</Text><TouchableOpacity style={styles.retryButton} onPress={() => reload()}><Text style={styles.retryText}>Попробовать снова</Text></TouchableOpacity></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}><Ionicons name="chevron-back" size={27} color="#111" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName || 'Лента заказов'}</Text>
        <View style={styles.iconButton} />
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}><Ionicons name="search-outline" size={18} color="#999" /><TextInput style={styles.searchInput} placeholder="Поиск заказов..." value={searchText} onChangeText={setSearchText} /></View>
      </View>
      <View style={styles.switcher}>
        <TouchableOpacity style={[styles.switchButton, mode === 'list' && styles.switchActive]} onPress={() => setMode('list')}><Ionicons name="list-outline" size={18} color={mode === 'list' ? '#fff' : '#555'} /><Text style={[styles.switchText, mode === 'list' && styles.switchTextActive]}>Список</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.switchButton, mode === 'map' && styles.switchActive]} onPress={() => setMode('map')}><Ionicons name="map-outline" size={18} color={mode === 'map' ? '#fff' : '#555'} /><Text style={[styles.switchText, mode === 'map' && styles.switchTextActive]}>Карта</Text></TouchableOpacity>
      </View>
      {mode === 'list' ? (
        <FlatList data={applications} renderItem={renderApplication} keyExtractor={(item) => item._id} contentContainerStyle={styles.list} ListEmptyComponent={renderEmpty} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} tintColor="#EC1B23" />} />
      ) : (
        <View style={styles.mapArea}>
          {mappableApplications.length ? <RequestMap applications={mappableApplications} loading={loading} onSelect={setSelectedApplication} /> : <View style={styles.empty}><Text style={styles.emptyTitle}>{applications.length ? 'У заявок пока не определено местоположение' : 'По выбранным фильтрам заявок не найдено'}</Text></View>}
          {selectedApplication && <View style={styles.selectedCard}><TouchableOpacity style={styles.closeSelected} onPress={() => setSelectedApplication(null)}><Ionicons name="close" size={20} color="#666" /></TouchableOpacity><Text style={styles.selectedTitle} numberOfLines={2}>{selectedApplication.title}</Text><Text style={styles.selectedPrice}>{selectedApplication.summ || 0} ₸</Text><Text style={styles.selectedMeta}>{selectedApplication.address || getCityName(selectedApplication.city)}</Text><Text style={styles.selectedStatus}>Статус: {selectedApplication.status || 'open'}</Text><TouchableOpacity style={styles.selectedButton} onPress={() => openApplication(selectedApplication)}><Text style={styles.selectedButtonText}>Открыть заявку</Text><Ionicons name="arrow-forward" size={16} color="#fff" /></TouchableOpacity></View>}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { height: 58, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111' },
  iconButton: { width: 36, alignItems: 'center' },
  searchRow: { padding: 10, backgroundColor: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 42, borderRadius: 10, backgroundColor: '#F2F2F2' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  switcher: { flexDirection: 'row', marginHorizontal: 10, marginVertical: 8, padding: 3, borderRadius: 10, backgroundColor: '#E9E9E9' },
  switchButton: { flex: 1, paddingVertical: 9, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  switchActive: { backgroundColor: '#EC1B23' },
  switchText: { color: '#555', fontWeight: '600' },
  switchTextActive: { color: '#fff' },
  list: { padding: 10, paddingBottom: 24, flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 13, marginBottom: 9 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111' },
  price: { color: '#EC1B23', fontSize: 15, fontWeight: '800' },
  description: { color: '#666', fontSize: 13, lineHeight: 18, marginTop: 7 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9, gap: 5 },
  meta: { flex: 1, color: '#666', fontSize: 12 },
  openButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  openButtonText: { color: '#EC1B23', fontWeight: '700', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { color: '#444', fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 8 },
  retryButton: { backgroundColor: '#EC1B23', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 11, marginTop: 16 },
  retryText: { color: '#fff', fontWeight: '700' },
  mapArea: { flex: 1, position: 'relative' },
  selectedCard: { position: 'absolute', left: 12, right: 12, bottom: 16, backgroundColor: '#fff', borderRadius: 14, padding: 15, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  closeSelected: { position: 'absolute', top: 8, right: 8, padding: 4 },
  selectedTitle: { paddingRight: 22, fontSize: 16, fontWeight: '800', color: '#111' },
  selectedPrice: { color: '#EC1B23', fontSize: 15, fontWeight: '800', marginTop: 6 },
  selectedMeta: { color: '#555', fontSize: 13, marginTop: 6 },
  selectedStatus: { color: '#777', fontSize: 12, marginTop: 4 },
  selectedButton: { marginTop: 11, paddingVertical: 10, borderRadius: 8, backgroundColor: '#EC1B23', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  selectedButtonText: { color: '#fff', fontWeight: '700' },
});

export default RequestMapFeedScreen;