import React from 'react';
import { View, StyleSheet } from 'react-native';

// Простой Skeleton Loader через View с пульсирующей анимацией
export const SkeletonLoader = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => (
  <View style={[styles.skeleton, { width, height, borderRadius }, style]} />
);

export const SkeletonCard = () => (
  <View style={styles.card}>
    <SkeletonLoader width="70%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
    <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="80%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
    <View style={styles.footer}>
      <SkeletonLoader width="30%" height={12} borderRadius={4} />
      <SkeletonLoader width="25%" height={12} borderRadius={4} />
    </View>
  </View>
);

export const SkeletonProfile = () => (
  <View style={styles.profile}>
    <SkeletonLoader width={80} height={80} borderRadius={40} style={{ marginBottom: 12, alignSelf: 'center' }} />
    <SkeletonLoader width="50%" height={18} borderRadius={4} style={{ marginBottom: 8, alignSelf: 'center' }} />
    <SkeletonLoader width="40%" height={14} borderRadius={4} style={{ marginBottom: 16, alignSelf: 'center' }} />
    <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="70%" height={14} borderRadius={4} />
  </View>
);

export const SkeletonChatMessage = () => (
  <View style={styles.message}>
    <SkeletonLoader width="70%" height={16} borderRadius={6} />
    <SkeletonLoader width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  profile: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  message: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
