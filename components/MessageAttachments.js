import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AttachmentViewer = ({ attachment, onClose }) => {
  const isImage = attachment.type === 'image';
  const isVideo = attachment.type === 'video';

  const getFileIcon = () => {
    switch (attachment.type) {
      case 'image':
        return 'image';
      case 'video':
        return 'play-circle';
      case 'file':
      default:
        return 'document';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (attachment.url) {
      Linking.openURL(attachment.url).catch(err =>
        console.warn('Error opening URL:', err)
      );
    }
  };

  if (isImage) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        transparent={true}
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{attachment.filename}</Text>
            <TouchableOpacity onPress={handleDownload}>
              <Ionicons name="download" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: attachment.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              Размер: {formatFileSize(attachment.size)}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <View style={styles.attachmentCard}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getFileIcon()}
          size={32}
          color={isVideo ? '#4CAF50' : '#2196F3'}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.filename} numberOfLines={2}>
          {attachment.filename}
        </Text>
        <Text style={styles.fileSize}>
          {formatFileSize(attachment.size)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownload}
      >
        <Ionicons name="download" size={20} color="#EC1B23" />
      </TouchableOpacity>
    </View>
  );
};

const MessageAttachments = ({ attachments = [] }) => {
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.attachmentsContainer}>
      {attachments.map((attachment, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            if (attachment.type === 'image') {
              setSelectedAttachment(attachment);
            } else {
              // Для остальных файлов открываем URL
              Linking.openURL(attachment.url).catch(err =>
                console.warn('Error opening URL:', err)
              );
            }
          }}
          activeOpacity={0.8}
        >
          {attachment.type === 'image' ? (
            <Image
              source={{ uri: attachment.url }}
              style={styles.attachmentImage}
            />
          ) : (
            <AttachmentViewer attachment={attachment} onClose={() => {}} />
          )}
        </TouchableOpacity>
      ))}

      {selectedAttachment && (
        <AttachmentViewer
          attachment={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  attachmentsContainer: {
    marginVertical: 8,
    gap: 8,
  },
  attachmentImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  filename: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 11,
    color: '#999',
  },
  downloadButton: {
    padding: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  infoText: {
    color: '#AAA',
    fontSize: 12,
    textAlign: 'center',
  },
});

export { AttachmentViewer };
export default MessageAttachments;
