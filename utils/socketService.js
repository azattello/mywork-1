import { io } from 'socket.io-client';
import { API_URL } from '../config';

let socketInstance = null;
let notificationHandlers = [];

export const initializeSocket = (userId) => {
  if (socketInstance && socketInstance.connected) {
    console.log('Socket already connected');
    return socketInstance;
  }

  socketInstance = io(API_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socketInstance.on('connect', () => {
    console.log('Socket connected:', socketInstance.id);
    // Join user room to receive personal notifications
    if (userId) {
      socketInstance.emit('join_user_room', userId);
      console.log('Joined room for user:', userId);
    }
  });

  socketInstance.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socketInstance.on('notification', (data) => {
    console.log('Received notification:', data);
    // Trigger all registered notification handlers
    notificationHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error('Error in notification handler:', err);
      }
    });
  });

  socketInstance.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socketInstance;
};

export const getSocket = () => {
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const addNotificationHandler = (handler) => {
  if (typeof handler === 'function') {
    notificationHandlers.push(handler);
    return () => {
      notificationHandlers = notificationHandlers.filter((h) => h !== handler);
    };
  }
};

export const removeNotificationHandler = (handler) => {
  notificationHandlers = notificationHandlers.filter((h) => h !== handler);
};
