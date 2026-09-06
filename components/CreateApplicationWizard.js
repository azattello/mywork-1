import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';

const { width } = Dimensions.get('window');

export default function CreateApplicationWizard({ navigation }) {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    info: '',
    categories: [],
    city: '',
    workMode: 'online',
    address: '',
    budgetType: 'fixed',
    summ: '',
    budgetMin: '',
    budgetMax: '',
    deadline: new Date(),
    photos: [],
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (userStr) setUser(JSON.parse(userStr));

      const citiesRes = await apiClient.get('/api/cities');
      if (citiesRes.data?.success) setCities(citiesRes.data.data || []);

      const catsRes = await apiClient.get('/api/categories');
      if (catsRes.data?.success) setCategories(catsRes.data.data || []);
    } catch (err) {
      console.error(err);
      Toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(catId)
        ? f.categories.filter((c) => c !== catId)
        : [...f.categories, catId],
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setForm((f) => ({ ...f, deadline: selectedDate }));
    }
    setShowDatePicker(false);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 5 - form.photos.length,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        }));
        setForm((f) => ({ ...f, photos: [...f.photos, ...newPhotos] }));
        Toast.success(`Добавлено ${newPhotos.length} фото`);
      }
    } catch (err) {
      Toast.error('Ошибка при выборе фото');
    }
  };

  const removePhoto = (index) => {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.title.trim()) return 'Введите название заказа (мин 3 символа)';
        if (form.title.trim().length < 3) return 'Название слишком короткое';
        if (!form.info.trim()) return 'Введите описание';
        if (form.info.trim().length < 10) return 'Описание минимум 10 символов';
        return null;
      case 2:
        if (form.categories.length === 0) return 'Выберите хотя бы одну категорию';
        return null;
      case 3:
        if (!form.city) return 'Выберите город';
        if (form.workMode === 'offline' && !form.address.trim()) return 'Укажите адрес для работы на месте';
        return null;
      case 4:
        if (form.budgetType === 'fixed') {
          if (!form.summ || isNaN(form.summ)) return 'Введите корректный бюджет';
          if (parseInt(form.summ) < 100) return 'Минимальный бюджет 100 ₸';
        } else {
          if (!form.budgetMin || !form.budgetMax) return 'Введите оба значения бюджета';
          if (isNaN(form.budgetMin) || isNaN(form.budgetMax)) return 'Введите корректные числа';
          if (parseInt(form.budgetMin) >= parseInt(form.budgetMax)) return 'Минимум должен быть меньше максимума';
        }
        return null;
      case 5:
        if (!form.deadline) return 'Выберите крайний срок';
        return null;
      default:
        return null;
    }
  };

  const nextStep = () => {
    const error = validateStep();
    if (error) {
      Toast.error(error);
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) {
      Toast.error(error);
      return;
    }

    try {
      setSubmitting(true);

      const appData = {
        title: form.title.trim(),
        info: form.info.trim(),
        categories: form.categories,
        city: form.city,
        workMode: form.workMode,
        address: form.address.trim() || undefined,
        budgetType: form.budgetType,
        summ: form.budgetType === 'fixed' ? parseInt(form.summ) : 0,
        budgetMin: form.budgetType === 'range' ? parseInt(form.budgetMin) : 0,
        budgetMax: form.budgetType === 'range' ? parseInt(form.budgetMax) : 0,
        deadline: form.deadline.toISOString(),
      };

      const appRes = await apiClient.post('/api/applications', appData);
      if (!appRes.data?.success) throw new Error('Failed to create application');

      const applicationId = appRes.data.data._id;

      // Upload photos if any
      if (form.photos.length > 0) {
        const formData = new FormData();
        form.photos.forEach((photo) => {
          formData.append('photos', {
            uri: photo.uri,
            type: 'image/jpeg',
            name: photo.name,
          });
        });

        try {
          await apiClient.post(`/api/applications/${applicationId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (photoErr) {
          console.warn('Photo upload failed:', photoErr);
        }
      }

      Toast.success('Заявка создана успешно!');
      navigation.navigate('Мои заявки');
    } catch (err) {
      console.error(err);
      Toast.error(err.response?.data?.message || 'Ошибка при создании заявки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#EC1B23" />
        </View>
      </SafeAreaView>
    );
  }

  const selectedCity = cities.find((c) => c._id === form.city);
  const selectedCats = categories.filter((c) => form.categories.includes(c._id));
  const totalSteps = 6;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header with progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <Text style={styles.stepText}>Шаг {step} из {totalSteps}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* STEP 1: Title & Description */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Название и описание</Text>
              <Text style={styles.stepSubtitle}>Дайте точное описание вашего заказа</Text>

              <View style={styles.section}>
                <Text style={styles.label}>Название заказа *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Например: Ремонт ванной комнаты"
                  value={form.title}
                  onChangeText={(title) => setForm((f) => ({ ...f, title }))}
                  placeholderTextColor="#ccc"
                />
                <Text style={styles.hint}>{form.title.length}/100</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Описание *</Text>
                <TextInput
                  style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                  placeholder="Подробнее расскажите о вашем заказе, что именно нужно сделать..."
                  value={form.info}
                  onChangeText={(info) => setForm((f) => ({ ...f, info }))}
                  multiline
                  placeholderTextColor="#ccc"
                />
                <Text style={styles.hint}>{form.info.length}/500</Text>
              </View>
            </View>
          )}

          {/* STEP 2: Category */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Выберите категорию</Text>
              <Text style={styles.stepSubtitle}>Что вам нужно сделать? (можно выбрать несколько)</Text>

              {selectedCats.length > 0 && (
                <View style={styles.selectedTags}>
                  {selectedCats.map((cat) => (
                    <TouchableOpacity key={cat._id} style={styles.tag} onPress={() => toggleCategory(cat._id)}>
                      <Text style={styles.tagText}>{cat.name} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <FlatList
                data={categories}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      form.categories.includes(item._id) && styles.categoryItemSelected,
                    ]}
                    onPress={() => toggleCategory(item._id)}
                  >
                    <View style={styles.categoryIcon}>
                      <Text style={styles.categoryIconText}>{item.icon || '🔧'}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{item.name}</Text>
                      {item.description && <Text style={styles.categoryDesc}>{item.description}</Text>}
                    </View>
                    <Ionicons
                      name={form.categories.includes(item._id) ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={form.categories.includes(item._id) ? '#EC1B23' : '#ddd'}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* STEP 3: City & WorkMode */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Город и режим работы</Text>
              <Text style={styles.stepSubtitle}>Где и как выполнить заказ?</Text>

              <View style={styles.section}>
                <Text style={styles.label}>Город *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setCityModalVisible(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {selectedCity?.name || 'Выберите город'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Режим работы *</Text>
                <View style={styles.modeContainer}>
                  {['online', 'offline'].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.modeButton,
                        form.workMode === mode && styles.modeButtonSelected,
                      ]}
                      onPress={() => setForm((f) => ({ ...f, workMode: mode }))}
                    >
                      <Ionicons
                        name={mode === 'online' ? 'globe-outline' : 'location-outline'}
                        size={20}
                        color={form.workMode === mode ? '#fff' : '#666'}
                      />
                      <Text
                        style={[
                          styles.modeButtonText,
                          form.workMode === mode && styles.modeButtonTextSelected,
                        ]}
                      >
                        {mode === 'online' ? 'Онлайн' : 'На месте'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {form.workMode === 'offline' && (
                <View style={styles.section}>
                  <Text style={styles.label}>Адрес *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Например: г. Астана, ул. Кабанбай батыра, 15"
                    value={form.address}
                    onChangeText={(address) => setForm((f) => ({ ...f, address }))}
                    placeholderTextColor="#ccc"
                  />
                  <Text style={styles.hint}>Адрес автоматически преобразуется в координаты для карты</Text>
                </View>
              )}

              {/* City Modal */}
              <Modal visible={cityModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                  <View style={styles.modal}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Выберите город</Text>
                      <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={cities}
                      keyExtractor={(item) => item._id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.cityItem}
                          onPress={() => {
                            setForm((f) => ({ ...f, city: item._id }));
                            setCityModalVisible(false);
                          }}
                        >
                          <Text style={styles.cityItemText}>{item.name}</Text>
                          {form.city === item._id && (
                            <Ionicons name="checkmark" size={20} color="#EC1B23" />
                          )}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </Modal>
            </View>
          )}

          {/* STEP 4: Budget */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Бюджет</Text>
              <Text style={styles.stepSubtitle}>Какой у вас бюджет на этот заказ?</Text>

              <View style={styles.section}>
                <Text style={styles.label}>Тип бюджета *</Text>
                <View style={styles.budgetTypeContainer}>
                  {['fixed', 'range'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.budgetTypeButton,
                        form.budgetType === type && styles.budgetTypeButtonSelected,
                      ]}
                      onPress={() => setForm((f) => ({ ...f, budgetType: type }))}
                    >
                      <Text
                        style={[
                          styles.budgetTypeText,
                          form.budgetType === type && styles.budgetTypeTextSelected,
                        ]}
                      >
                        {type === 'fixed' ? 'Фиксированный' : 'Диапазон'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {form.budgetType === 'fixed' ? (
                <View style={styles.section}>
                  <Text style={styles.label}>Сумма (₸) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Введите сумму"
                    value={form.summ}
                    onChangeText={(summ) => setForm((f) => ({ ...f, summ }))}
                    keyboardType="numeric"
                    placeholderTextColor="#ccc"
                  />
                </View>
              ) : (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>От (₸) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Минимальный бюджет"
                      value={form.budgetMin}
                      onChangeText={(budgetMin) => setForm((f) => ({ ...f, budgetMin }))}
                      keyboardType="numeric"
                      placeholderTextColor="#ccc"
                    />
                  </View>
                  <View style={styles.section}>
                    <Text style={styles.label}>До (₸) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Максимальный бюджет"
                      value={form.budgetMax}
                      onChangeText={(budgetMax) => setForm((f) => ({ ...f, budgetMax }))}
                      keyboardType="numeric"
                      placeholderTextColor="#ccc"
                    />
                  </View>
                </>
              )}
            </View>
          )}

          {/* STEP 5: Deadline & Photos */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Крайний срок</Text>
              <Text style={styles.stepSubtitle}>Когда нужно завершить работу?</Text>

              <View style={styles.section}>
                <Text style={styles.label}>Крайний срок *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {form.deadline.toLocaleDateString('ru-RU')}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={form.deadline}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.stepTitle} style={{ marginTop: 20 }}>
                Добавьте фото
              </Text>
              <Text style={styles.stepSubtitle}>Фото помогут специалистам лучше понять заказ (опционально)</Text>

              {form.photos.length > 0 && (
                <FlatList
                  data={form.photos}
                  keyExtractor={(_, index) => index.toString()}
                  scrollEnabled={false}
                  numColumns={3}
                  columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                  renderItem={({ item, index }) => (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: item.uri }} style={styles.photo} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              {form.photos.length < 5 && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Ionicons name="add" size={28} color="#EC1B23" />
                  <Text style={styles.addPhotoText}>
                    Добавить фото ({form.photos.length}/5)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* STEP 6: Review */}
          {step === 6 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Проверьте заявку</Text>
              <Text style={styles.stepSubtitle}>Все ли правильно заполнено?</Text>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Название</Text>
                <Text style={styles.reviewValue}>{form.title}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Описание</Text>
                <Text style={styles.reviewValue}>{form.info}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Категории</Text>
                <View style={styles.reviewTags}>
                  {selectedCats.map((cat) => (
                    <View key={cat._id} style={styles.reviewTag}>
                      <Text style={styles.reviewTagText}>{cat.name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Город</Text>
                <Text style={styles.reviewValue}>{selectedCity?.name}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Режим работы</Text>
                <Text style={styles.reviewValue}>{form.workMode === 'online' ? 'Онлайн' : 'На месте'}</Text>
              </View>

              {form.address ? (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Адрес</Text>
                  <Text style={styles.reviewValue}>{form.address}</Text>
                </View>
              ) : null}

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Бюджет</Text>
                <Text style={styles.reviewValue}>
                  {form.budgetType === 'fixed'
                    ? `${form.summ} ₸`
                    : `${form.budgetMin} - ${form.budgetMax} ₸`}
                </Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Крайний срок</Text>
                <Text style={styles.reviewValue}>{form.deadline.toLocaleDateString('ru-RU')}</Text>
              </View>

              {form.photos.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>Фото ({form.photos.length})</Text>
                  <View style={styles.reviewPhotos}>
                    {form.photos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo.uri }}
                        style={styles.reviewPhoto}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, step === 1 && styles.buttonDisabled]}
            onPress={prevStep}
            disabled={step === 1}
          >
            <Text style={styles.buttonText}>← Назад</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              submitting && styles.buttonDisabled,
            ]}
            onPress={step === totalSteps ? handleSubmit : nextStep}
            disabled={submitting}
          >
            <Text style={styles.buttonTextPrimary}>
              {submitting ? 'Создание...' : step === totalSteps ? '✓ Создать' : 'Далее →'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EC1B23',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  modeButtonSelected: {
    backgroundColor: '#EC1B23',
    borderColor: '#EC1B23',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextSelected: {
    color: '#fff',
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  categoryItemSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#EC1B23',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  categoryDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#EC1B23',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  cityItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cityItemText: {
    fontSize: 14,
    color: '#333',
  },
  budgetTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetTypeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  budgetTypeButtonSelected: {
    backgroundColor: '#EC1B23',
    borderColor: '#EC1B23',
  },
  budgetTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  budgetTypeTextSelected: {
    color: '#fff',
  },
  addPhotoButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#EC1B23',
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EC1B23',
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#000000AA',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  reviewTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reviewTagText: {
    fontSize: 12,
    color: '#666',
  },
  reviewPhotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  reviewPhoto: {
    width: (width - 40) / 3,
    aspectRatio: 1,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#EC1B23',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  buttonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
