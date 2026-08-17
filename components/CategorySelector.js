import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import apiClient from '../utils/apiClient';
import {
  toggleParentCategorySelection,
  toggleSubcategorySelection,
} from '../utils/categorySelection';

const CategorySelector = ({
  onSelect,
  selectedCategories = [],
  allowMultiple = true,
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selected, setSelected] = useState(Array.isArray(selectedCategories) ? selectedCategories : []);

  useEffect(() => {
    setSelected(Array.isArray(selectedCategories) ? selectedCategories : []);
  }, [selectedCategories]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/categories');
      if (response?.data?.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectParent = async (category) => {
    const isSame = selectedParent?._id === category._id;
    if (isSame) {
      setSelectedParent(null);
      setSubcategories([]);
      return;
    }

    setSelectedParent(category);
    try {
      const response = await apiClient.get(`/api/categories/${category._id}`);
      const items = response?.data?.data?.subcategories || response?.data?.data || [];
      setSubcategories(items);
    } catch (error) {
      console.error('Ошибка загрузки подкатегорий:', error);
      setSubcategories([]);
    }
  };

  const handleSelectSubcategory = (subcategory) => {
    const parentCategory = (categories || []).find((category) =>
      category._id === selectedParent?._id || (category.subcategories || []).some((sub) => sub._id === subcategory._id)
    );

    let updated;
    if (allowMultiple) {
      const baseSelection = Array.isArray(selected) ? [...selected] : [];
      const isSelected = baseSelection.includes(subcategory._id);
      if (isSelected && baseSelection.length === 1) {
        Alert.alert('Требуется минимум одна категория', 'Выберите хотя бы одну категорию для вашей специальности');
        return;
      }
      updated = parentCategory
        ? toggleSubcategorySelection(parentCategory, baseSelection, subcategory._id)
        : isSelected
          ? baseSelection.filter((id) => id !== subcategory._id)
          : [...baseSelection, subcategory._id];
    } else {
      updated = [subcategory._id];
    }

    setSelected(updated);
    onSelect(updated);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EC1B23" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!selectedParent ? (
        <View style={styles.screen}>
          <Text style={styles.title}>Выберите основную категорию</Text>
          <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryButton}
                onPress={() => handleSelectParent(category)}
              >
                <Text style={styles.categoryIcon}>{category.icon || '📌'}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.screen}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedParent(null); setSubcategories([]); }}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{selectedParent.name}</Text>
          <Text style={styles.subtitle}>
            {allowMultiple ? 'Выберите одну или несколько подкатегорий:' : 'Выберите подкатегорию:'}
          </Text>

          <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
            {(subcategories || []).map((item) => {
              const isSelected = selected.includes(item._id);
              return (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.subcategoryButton, isSelected && styles.subcategoryButtonSelected]}
                  onPress={() => handleSelectSubcategory(item)}
                >
                  <View style={styles.checkbox}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.subcategoryIcon}>{item.icon || '•'}</Text>
                  <Text style={styles.subcategoryName}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selected.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.selectedLabel}>Выбрано: {selected.length}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screen: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#222' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  backButton: { paddingVertical: 10, marginBottom: 12 },
  backButtonText: { fontSize: 16, color: '#EC1B23', fontWeight: '600' },
  categoriesScroll: { flex: 1 },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryIcon: { fontSize: 24, marginRight: 12 },
  categoryName: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1 },
  categoryArrow: { fontSize: 20, color: '#999' },
  subcategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  subcategoryButtonSelected: { backgroundColor: '#fff1f1', borderColor: '#EC1B23' },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#EC1B23',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: { color: '#EC1B23', fontSize: 14, fontWeight: '700' },
  subcategoryIcon: { fontSize: 18, marginRight: 10 },
  subcategoryName: { fontSize: 15, color: '#333', flex: 1 },
  selectedContainer: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  selectedLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
});

export default CategorySelector;
