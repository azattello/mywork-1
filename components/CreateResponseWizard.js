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
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../utils/apiClient';
import { Toast } from '../utils/ToastManager';

export default function CreateResponseWizard({ route, navigation }) {
  const { applicationId } = route.params;
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    priceType: 'fixed', // 'fixed' or 'range'
    price: '',
    priceMin: '',
    priceMax: '',
    estimatedDays: '',
    description: '',
    portfolioPhotos: [],
  });

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      setLoading(true);

      // Get current user
      const userStr = await AsyncStorage.getItem('@currentUser');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }

      // Get application details
      const appRes = await apiClient.get(`/api/applications/${applicationId}`);
      if (appRes.data?.data) {
        setApplication(appRes.data.data);
      }
    } catch (err) {
      console.error(err);
      Toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const pickPortfolioPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 3 - form.portfolioPhotos.length,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        }));
        setForm((f) => ({ ...f, portfolioPhotos: [...f.portfolioPhotos, ...newPhotos] }));
        Toast.success(`Добавлено ${newPhotos.length} фото`);
      }
    } catch (err) {
      Toast.error('Ошибка при выборе фото');
    }
  };

  const removePortfolioPhoto = (index) => {
    setForm((f) => ({ ...f, portfolioPhotos: f.portfolioPhotos.filter((_, i) => i !== index) }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (form.priceType === 'fixed') {
          if (!form.price || isNaN(form.price)) return 'Введите корректную цену';
          if (parseInt(form.price) < 100) return 'Минимальная цена 100 ₸';
        } else {
          if (!form.priceMin || !form.priceMax) return 'Введите оба значения цены';
          if (isNaN(form.priceMin) || isNaN(form.priceMax)) return 'Введите корректные числа';
          if (parseInt(form.priceMin) >= parseInt(form.priceMax))
            return 'Минимум должен быть меньше максимума';
        }
        if (!form.estimatedDays || isNaN(form.estimatedDays)) return 'Введите количество дней';
        if (parseInt(form.estimatedDays) < 1) return 'Минимум 1 день';
        return null;

      case 2:
        if (!form.description.trim()) return 'Введите описание подхода';
        if (form.description.trim().length < 20) return 'Описание минимум 20 символов';
        return null;

      case 3:
        // Experience is just info display, always valid
        return null;

      case 4:
        // Portfolio photos are optional, always valid
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

      const responseData = {
        offeredPrice:
          form.priceType === 'fixed'
            ? parseInt(form.price)
            : `${parseInt(form.priceMin)}-${parseInt(form.priceMax)}`,
        estimatedDuration: `${parseInt(form.estimatedDays)} дней`,
        description: form.description.trim(),
      };

      const res = await apiClient.post(`/api/applications/${applicationId}/respond`, responseData);

      if (!res.data?.success) throw new Error('Failed to create response');

      Toast.success('Предложение отправлено!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.error(err.response?.data?.message || 'Ошибка при отправке предложения');
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

  const totalSteps = 5;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header with progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <Text style={styles.stepText}>
              Шаг {step} из {totalSteps}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {/* Application Info */}
        {application && (
          <View style={styles.appInfoCard}>
            <Text style={styles.appTitle} numberOfLines={2}>
              {application.title}
            </Text>
            <View style={styles.appMeta}>
              <Text style={styles.appMetaText}>
                💰{' '}
                {application.budgetType === 'fixed'
                  ? `${application.summ} ₸`
                  : `${application.budgetMin}-${application.budgetMax} ₸`}
              </Text>
              {application.deadline && (
                <Text style={styles.appMetaText}>
                  📅 до {new Date(application.deadline).toLocaleDateString('ru-RU')}
                </Text>
              )}
            </View>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* STEP 1: Price & Duration */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Цена и сроки</Text>
              <Text style={styles.stepSubtitle}>Сколько будет стоить и за какой срок?</Text>

              <View style={styles.section}>
                <Text style={styles.label}>Тип цены *</Text>
                <View style={styles.priceTypeContainer}>
                  {['fixed', 'range'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.priceTypeButton,
                        form.priceType === type && styles.priceTypeButtonSelected,
                      ]}
                      onPress={() => setForm((f) => ({ ...f, priceType: type }))}
                    >
                      <Text
                        style={[
                          styles.priceTypeText,
                          form.priceType === type && styles.priceTypeTextSelected,
                        ]}
                      >
                        {type === 'fixed' ? 'Фиксированная' : 'Диапазон'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {form.priceType === 'fixed' ? (
                <View style={styles.section}>
                  <Text style={styles.label}>Цена (₸) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Введите цену"
                    value={form.price}
                    onChangeText={(price) => setForm((f) => ({ ...f, price }))}
                    keyboardType="numeric"
                    placeholderTextColor="#ccc"
                  />
                  <Text style={styles.hint}>Минимум 100 ₸</Text>
                </View>
              ) : (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>От (₸) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Минимальная цена"
                      value={form.priceMin}
                      onChangeText={(priceMin) => setForm((f) => ({ ...f, priceMin }))}
                      keyboardType="numeric"
                      placeholderTextColor="#ccc"
                    />
                  </View>
                  <View style={styles.section}>
                    <Text style={styles.label}>До (₸) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Максимальная цена"
                      value={form.priceMax}
                      onChangeText={(priceMax) => setForm((f) => ({ ...f, priceMax }))}
                      keyboardType="numeric"
                      placeholderTextColor="#ccc"
                    />
                  </View>
                </>
              )}

              <View style={styles.section}>
                <Text style={styles.label}>Сроки выполнения (дней) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Например: 5"
                  value={form.estimatedDays}
                  onChangeText={(estimatedDays) => setForm((f) => ({ ...f, estimatedDays }))}
                  keyboardType="numeric"
                  placeholderTextColor="#ccc"
                />
              </View>
            </View>
          )}

          {/* STEP 2: Description */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ваш подход</Text>
              <Text style={styles.stepSubtitle}>Расскажите, как вы будете выполнять работу</Text>

              <View style={styles.section}>
                <Text style={styles.label}>Описание подхода *</Text>
                <TextInput
                  style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
                  placeholder="Опишите ваш подход, преимущества, методы. Почему клиент должен выбрать вас?"
                  value={form.description}
                  onChangeText={(description) => setForm((f) => ({ ...f, description }))}
                  multiline
                  placeholderTextColor="#ccc"
                />
                <Text style={styles.hint}>{form.description.length}/500 символов</Text>
              </View>

              <View style={styles.tipsCard}>
                <Ionicons name="bulb-outline" size={20} color="#FFC107" />
                <Text style={styles.tipsText}>
                  Совет: Напишите конкретно, чем вы отличаетесь. Упомяните опыт, примеры работ, гарантии.
                </Text>
              </View>
            </View>
          )}

          {/* STEP 3: Experience */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ваш опыт</Text>
              <Text style={styles.stepSubtitle}>Информация из вашего профиля</Text>

              <View style={styles.experienceCard}>
                <View style={styles.expRow}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <View style={styles.expInfo}>
                    <Text style={styles.expLabel}>Рейтинг</Text>
                    <Text style={styles.expValue}>
                      {user?.rating?.toFixed(1) || '—'} ⭐ (
                      {user?.reviewCount || 0} отзывов)
                    </Text>
                  </View>
                </View>

                <View style={styles.expRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <View style={styles.expInfo}>
                    <Text style={styles.expLabel}>Завершенные заказы</Text>
                    <Text style={styles.expValue}>{user?.completedOrdersCount || 0}</Text>
                  </View>
                </View>

                <View style={styles.expRow}>
                  <Ionicons name="person" size={20} color="#2196F3" />
                  <View style={styles.expInfo}>
                    <Text style={styles.expLabel}>Имя</Text>
                    <Text style={styles.expValue}>{user?.name || 'Не указано'}</Text>
                  </View>
                </View>

                {user?.description && (
                  <View style={styles.expRow}>
                    <Ionicons name="document-text" size={20} color="#666" />
                    <View style={styles.expInfo}>
                      <Text style={styles.expLabel}>О себе</Text>
                      <Text style={styles.expValue} numberOfLines={2}>
                        {user.description}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="pencil" size={16} color="#EC1B23" />
                <Text style={styles.editProfileText}>Редактировать профиль</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Portfolio */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Примеры работ (опционально)</Text>
              <Text style={styles.stepSubtitle}>Добавьте до 3 фото для демонстрации</Text>

              {form.portfolioPhotos.length > 0 && (
                <FlatList
                  data={form.portfolioPhotos}
                  keyExtractor={(_, index) => index.toString()}
                  scrollEnabled={false}
                  numColumns={2}
                  columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                  renderItem={({ item, index }) => (
                    <View style={styles.portfolioPhotoContainer}>
                      <Image source={{ uri: item.uri }} style={styles.portfolioPhoto} />
                      <TouchableOpacity
                        style={styles.removePhotoBtnSmall}
                        onPress={() => removePortfolioPhoto(index)}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              {form.portfolioPhotos.length < 3 && (
                <TouchableOpacity style={styles.addPortfolioButton} onPress={pickPortfolioPhotos}>
                  <Ionicons name="add" size={32} color="#EC1B23" />
                  <Text style={styles.addPortfolioText}>
                    Добавить фото ({form.portfolioPhotos.length}/3)
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.tipsCard}>
                <Ionicons name="bulb-outline" size={20} color="#FFC107" />
                <Text style={styles.tipsText}>
                  Совет: Добавьте яркие примеры своих лучших работ. Это увеличит вероятность принятия предложения.
                </Text>
              </View>
            </View>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Проверьте предложение</Text>
              <Text style={styles.stepSubtitle}>Всё ли правильно?</Text>

              <View style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Цена</Text>
                  <Text style={styles.reviewValue}>
                    {form.priceType === 'fixed'
                      ? `${form.price} ₸`
                      : `${form.priceMin} - ${form.priceMax} ₸`}
                  </Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Сроки</Text>
                  <Text style={styles.reviewValue}>{form.estimatedDays} дней</Text>
                </View>

                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Описание</Text>
                  <Text style={styles.reviewValue} numberOfLines={3}>
                    {form.description}
                  </Text>
                </View>

                {form.portfolioPhotos.length > 0 && (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Примеры ({form.portfolioPhotos.length})</Text>
                    <View style={styles.reviewPhotosContainer}>
                      {form.portfolioPhotos.map((photo, index) => (
                        <Image key={index} source={{ uri: photo.uri }} style={styles.reviewPhotoSmall} />
                      ))}
                    </View>
                  </View>
                )}
              </View>
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
            style={[styles.button, styles.buttonPrimary, submitting && styles.buttonDisabled]}
            onPress={step === totalSteps ? handleSubmit : nextStep}
            disabled={submitting}
          >
            <Text style={styles.buttonTextPrimary}>
              {submitting ? 'Отправка...' : step === totalSteps ? '✓ Отправить' : 'Далее →'}
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
    paddingBottom: 12,
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
  appInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EC1B23',
  },
  appTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  appMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  appMetaText: {
    fontSize: 12,
    color: '#666',
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
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
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
  priceTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceTypeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  priceTypeButtonSelected: {
    backgroundColor: '#EC1B23',
    borderColor: '#EC1B23',
  },
  priceTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  priceTypeTextSelected: {
    color: '#fff',
  },
  tipsCard: {
    backgroundColor: '#FFFBF0',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  tipsText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  experienceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  expRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  expInfo: {
    flex: 1,
  },
  expLabel: {
    fontSize: 12,
    color: '#999',
  },
  expValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  editProfileButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#EC1B23',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EC1B23',
  },
  addPortfolioButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#EC1B23',
    borderRadius: 8,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  addPortfolioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EC1B23',
  },
  portfolioPhotoContainer: {
    flex: 1,
    position: 'relative',
  },
  portfolioPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  removePhotoBtnSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#000000AA',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  reviewRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottomHorizontal: 12,
    paddingBottom: 12,
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
  reviewPhotosContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reviewPhotoSmall: {
    width: 80,
    height: 80,
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
