import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../utils/apiClient';

export default function VerificationScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request('get', '/api/users/me');
      if (res.data && res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.error('load user', err);
    } finally {
      setLoading(false);
    }
  };

  const pickDocuments = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нужно разрешение', 'Пожалуйста разрешите доступ к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8
      });

      if (!result.cancelled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = uri.split('/').pop();
        const match = (filename || '').match(/\.([0-9a-z]+)(?:\?|$)/i);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        setSelectedFiles([...selectedFiles, {
          uri,
          name: filename,
          type
        }]);
      }
    } catch (err) {
      console.error('pick image error', err);
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нужно разрешение', 'Пожалуйста разрешите доступ к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8
      });

      if (!result.cancelled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = uri.split('/').pop();
        const match = (filename || '').match(/\.([0-9a-z]+)(?:\?|$)/i);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        setSelectedFiles([...selectedFiles, {
          uri,
          name: filename,
          type
        }]);
      }
    } catch (err) {
      console.error('pick image error', err);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const submitVerification = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста выберите хотя бы один документ');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      selectedFiles.forEach((file, index) => {
        form.append('docs', {
          uri: file.uri,
          name: file.name,
          type: file.type
        });
      });

      const res = await apiClient.submitVerification(form);
      if (res.data && res.data.success) {
        setUser(res.data.data);
        setSelectedFiles([]);
        Alert.alert('Успешно', 'Документы отправлены на проверку');
        navigation.goBack();
      }
    } catch (err) {
      console.error('submit verification error', err);
      Alert.alert('Ошибка', 'Не удалось отправить документы');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Подтверждено';
      case 'pending':
        return 'На проверке';
      case 'rejected':
        return 'Отклонено';
      default:
        return 'Не начиналось';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color="#EC1B23" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.wrapper}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={s.title}>Верификация</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={s.body}>
        {/* Current Status */}
        <View style={s.statusCard}>
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Статус:</Text>
            <View style={[s.statusBadge, { backgroundColor: getStatusColor(user.verification?.status) }]}>
              <Text style={s.statusBadgeText}>
                {getStatusText(user.verification?.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Uploaded Documents */}
        {user.verification?.docs && user.verification.docs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Загруженные документы</Text>
            {user.verification.docs.map((doc, i) => (
              <View key={i} style={s.docItem}>
                <Ionicons name="document-text" size={24} color="#EC1B23" />
                <Text style={s.docName} numberOfLines={2}>
                  {doc.split('/').pop()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Select New Documents */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            {user.verification?.status === 'rejected' ? 'Загрузить документы повторно' : 'Загрузить документы'}
          </Text>
          <Text style={s.hint}>
            Поддерживаются: скан паспорта, водительского удостоверения, лицензии или другие документы (фото или изображения в хорошем качестве)
          </Text>

          <View style={s.buttonGroup}>
            <TouchableOpacity style={s.pickButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color="#EC1B23" />
              <Text style={s.pickButtonText}>Выбрать фото</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>К отправке ({selectedFiles.length})</Text>
            {selectedFiles.map((file, i) => (
              <View key={i} style={s.selectedFileItem}>
                <View style={s.selectedFileInfo}>
                  <Ionicons name="document-attach" size={20} color="#666" />
                  <Text style={s.selectedFileName} numberOfLines={2}>
                    {file.name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFile(i)}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.button, s.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[s.buttonText, { color: '#666' }]}>Отмена</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.button, s.submitButton]}
          onPress={submitVerification}
          disabled={uploading || selectedFiles.length === 0}
        >
          <Text style={s.buttonText}>
            {uploading ? 'Отправка...' : 'Отправить'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F2F2F2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '700' },
  body: { flex: 1, padding: 16 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#333' },
  hint: { fontSize: 13, color: '#999', marginBottom: 12 },
  buttonGroup: { flexDirection: 'row', gap: 10 },
  pickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EC1B23',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  pickButtonText: { color: '#EC1B23', fontSize: 13, fontWeight: '600' },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 10,
  },
  docName: { flex: 1, fontSize: 13, color: '#666' },
  selectedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedFileName: { flex: 1, fontSize: 13, color: '#333' },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  cancelButton: { backgroundColor: '#f0f0f0' },
  submitButton: { backgroundColor: '#EC1B23' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
