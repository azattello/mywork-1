import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvatarUri } from '../utils/imageUri';

const renderStars = (rating) => {
  const stars = [];
  const roundedRating = Math.round(rating || 0);

  for (let i = 0; i < 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i < roundedRating ? 'star' : 'star-outline'}
        size={14}
        color="#FFD700"
        style={{ marginRight: 2 }}
      />
    );
  }
  return stars;
};

const ResponseCard = ({
  response,
  application,
  currentUserId,
  onChat,
  onProfile,
  onAccept,
  onReject,
  isProcessing,
}) => {
  // Determine response status
  const isAccepted = response.status === 'accepted';
  const isConfirmed = response.status === 'confirmed';
  const isDeclined = response.status === 'declined';
  const isPending = response.status === 'pending';

  const specialist = response.specialist || {};
  const displayName = specialist.name && specialist.surname 
    ? `${specialist.name} ${specialist.surname}`
    : specialist.name || 'Специалист';

  // Determine card background and border colors
  let cardBgColor = '#fff';
  let borderLeftColor = '#EC1B23';
  
  if (isConfirmed) {
    cardBgColor = '#F5F5F5';
    borderLeftColor = '#4CAF50';
  } else if (isAccepted) {
    cardBgColor = '#FFFBF0';
    borderLeftColor = '#FF9800';
  } else if (isDeclined) {
    cardBgColor = '#F5F5F5';
    borderLeftColor = '#999';
  }

  return (
    <View style={[styles.card, { backgroundColor: cardBgColor, borderLeftColor }]}>
      {/* Header: Avatar + Name + Rating */}
      <View style={styles.header}>
        <View style={styles.avatarSection}>
          {getAvatarUri(specialist) ? (
            <Image source={{ uri: getAvatarUri(specialist) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#ccc" />
            </View>
          )}
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>{renderStars(specialist.rating)}</View>
            <Text style={styles.ratingText}>
              {specialist.rating?.toFixed(1) || '—'} ({specialist.reviewCount || 0})
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(response.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(response.status)}</Text>
        </View>
      </View>

      {/* Offer Details */}
      <View style={styles.offerSection}>
        <View style={styles.offerRow}>
          <Ionicons name="pricetag-outline" size={16} color="#EC1B23" />
          <Text style={styles.offerLabel}>Цена:</Text>
          <Text style={styles.offerValue}>
            {typeof response.price === 'number' ? `${response.price} ₸` : response.price || '—'}
          </Text>
        </View>

        <View style={styles.offerRow}>
          <Ionicons name="calendar-outline" size={16} color="#2196F3" />
          <Text style={styles.offerLabel}>Сроки:</Text>
          <Text style={styles.offerValue}>{response.estimatedDuration || '—'}</Text>
        </View>
      </View>

      {/* Description */}
      {response.description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Описание подхода:</Text>
          <Text style={styles.description} numberOfLines={2}>
            {response.description}
          </Text>
        </View>
      )}

      {/* Specialist Info */}
      <View style={styles.specialistInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
          <Text style={styles.infoText}>
            {specialist.completedOrdersCount || 0} завершенных заказов
          </Text>
        </View>
        {specialist.description && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={14} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              {specialist.description}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => onChat(specialist._id, displayName)}
          disabled={isProcessing}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Чат</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.profileButton]}
          onPress={() => onProfile(specialist._id, displayName)}
          disabled={isProcessing}
        >
          <Ionicons name="person-outline" size={16} color="#EC1B23" />
          <Text style={styles.profileButtonText}>Профиль</Text>
        </TouchableOpacity>

        {isPending && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => onAccept(response._id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Принять</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject(response._id)}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={16} color="#f44336" />
              <Text style={styles.rejectButtonText}>Отклонить</Text>
            </TouchableOpacity>
          </>
        )}

        {isAccepted && (
          <View style={styles.pendingConfirmMessage}>
            <Ionicons name="information-circle" size={14} color="#FF9800" />
            <Text style={styles.pendingConfirmText}>
              Ожидаем подтверждения специалиста
            </Text>
          </View>
        )}

        {isConfirmed && (
          <View style={styles.confirmedMessage}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={styles.confirmedText}>Работа в процессе</Text>
          </View>
        )}

        {isDeclined && (
          <View style={styles.declinedMessage}>
            <Ionicons name="close-circle" size={14} color="#999" />
            <Text style={styles.declinedText}>Отклонено</Text>
          </View>
        )}
      </View>
    </View>
  );
};

function getStatusLabel(status) {
  const labels = {
    pending: '⏳ Ожидание',
    accepted: '⚡ Принято',
    confirmed: '✓ Подтверждено',
    declined: '✕ Отклонено',
  };
  return labels[status] || status;
}

function getStatusBgColor(status) {
  const colors = {
    pending: '#EC1B23',
    accepted: '#FF9800',
    confirmed: '#4CAF50',
    declined: '#999',
  };
  return colors[status] || '#666';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EC1B23',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    backgroundColor: '#EC1B23',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  offerSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    width: 50,
  },
  offerValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 10,
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  specialistInfo: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  chatButton: {
    backgroundColor: '#EC1B23',
    flex: 0.5,
  },
  profileButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EC1B23',
    flex: 0.45,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    flex: 0.48,
  },
  rejectButton: {
    backgroundColor: '#f0f0f0',
    flex: 0.48,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EC1B23',
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f44336',
  },
  pendingConfirmMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
  },
  pendingConfirmText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
  },
  confirmedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    flex: 1,
  },
  confirmedText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  declinedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    flex: 1,
  },
  declinedText: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '600',
  },
});

export default ResponseCard;
