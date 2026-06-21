import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import axios from 'axios';

// Временный API endpoint (нужно заменить на реальный)
const API_URL = 'http://172.20.10.2:4000/api';

/**
 * CategorySelector - компонент для выбора категорий с иерархией
 * 
 * Props:
 * - onSelect: функция, вызываемая при выборе категорий (массив IDs)
 * - selectedCategories: массив уже выбранных IDs (опционально)
 * - allowMultiple: позволить выбирать несколько (по умолчанию true)
 */
const CategorySelector = ({ 
  onSelect, 
  selectedCategories = [],
  allowMultiple = true 
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selected, setSelected] = useState(selectedCategories);

  // Загрузить категории при монтировании
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузить подкатегории при выборе родительской
  const handleSelectParent = async (category) => {
    setSelectedParent(category);
    try {
      const response = await axios.get(`${API_URL}/categories/${category._id}`);
      if (response.data.success) {
        setSubcategories(response.data.data.subcategories || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки подкатегорий:', error);
    }
  };

  // Обработка выбора подкатегории
  const handleSelectSubcategory = (subcategory) => {
    let updated;
    if (allowMultiple) {
      const isSelected = selected.includes(subcategory._id);
      
      // Если это последняя выбранная категория и пытаемся снять - покажем ошибку
      if (isSelected && selected.length === 1) {
        Alert.alert(
          'Требуется минимум одна категория',
          'Выберите хотя бы одну категорию для вашей специальности'
        );
        return;
      }
      
      updated = isSelected
        ? selected.filter(id => id !== subcategory._id)
        : [...selected, subcategory._id];
    } else {
      updated = [subcategory._id];
    }
    setSelected(updated);
    onSelect(updated);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!selectedParent ? (
        // Экран выбора главной категории
        <View style={styles.screen}>
          <Text style={styles.title}>Выберите категорию:</Text>
          <ScrollView style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryButton}
                onPress={() => handleSelectParent(category)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        // Экран выбора подкатегорий
        <View style={styles.screen}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSelectedParent(null);
              setSubcategories([]);
            }}
          >
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{selectedParent.name}</Text>
          <Text style={styles.subtitle}>
            {allowMultiple ? 'Выберите одну или несколько подкатегорий:' : 'Выберите подкатегорию:'}
          </Text>

          <FlatList
            data={subcategories}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const isSelected = selected.includes(item._id);
              return (
                <TouchableOpacity
                  style={[
                    styles.subcategoryButton,
                    isSelected && styles.subcategoryButtonSelected
                  ]}
                  onPress={() => handleSelectSubcategory(item)}
                >
                  <View style={styles.checkbox}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.subcategoryIcon}>{item.icon}</Text>
                  <Text style={styles.subcategoryName}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          />

          {/* Показать выбранные */}
          {selected.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.selectedLabel}>
                Выбрано: {selected.length}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  categoriesScroll: {
    flex: 1,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  subcategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  subcategoryButtonSelected: {
    backgroundColor: '#e6f2ff',
    borderColor: '#0066cc',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#0066cc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subcategoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  subcategoryName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  selectedContainer: {
    backgroundColor: '#e6f2ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  selectedLabel: {
    color: '#0066cc',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CategorySelector;
