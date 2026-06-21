import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchFilterBar = ({
  onSearch,
  onFilterChange,
  placeholder = 'Поиск...',
  showFilters = true,
  filters = [],
}) => {
  const [searchText, setSearchText] = useState('');
  const [expandFilters, setExpandFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const handleSearch = (text) => {
    setSearchText(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleFilterToggle = (filterId) => {
    const updated = { ...activeFilters };
    updated[filterId] = !updated[filterId];
    setActiveFilters(updated);
    if (onFilterChange) {
      onFilterChange(updated);
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchText('');
    if (onSearch) onSearch('');
    if (onFilterChange) onFilterChange({});
  };

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Toggle */}
      {showFilters && filters.length > 0 && (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setExpandFilters(!expandFilters)}
        >
          <Ionicons name="filter" size={18} color="#EC1B23" />
          {activeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Filters */}
      {expandFilters && filters.length > 0 && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Фильтры</Text>
            {activeCount > 0 && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearText}>Очистить</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  activeFilters[filter.id] && styles.filterChipActive,
                ]}
                onPress={() => handleFilterToggle(filter.id)}
              >
                <Ionicons
                  name={activeFilters[filter.id] ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={activeFilters[filter.id] ? '#EC1B23' : '#999'}
                  style={styles.chipIcon}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilters[filter.id] && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 0,
  },
  filterButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EC1B23',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  filtersContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  clearText: {
    fontSize: 12,
    color: '#EC1B23',
    fontWeight: '600',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#fff',
    borderColor: '#EC1B23',
  },
  chipIcon: {
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#EC1B23',
    fontWeight: '600',
  },
});

export default SearchFilterBar;
