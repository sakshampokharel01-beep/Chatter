import { io } from 'socket.io-client';

let socket = null;
let currentUserId = null;

export const getSocket = (userId, userName) => {
  // If socket exists and is for the same user, return it
  if (socket && socket.connected && currentUserId === userId) {
    return socket;
  }

  // If socket exists but for different user, disconnect old one
  if (socket && currentUserId !== userId) {
    socket.disconnect();
    socket = null;
  }

  // Create new socket connection
  if (!socket) {
    currentUserId = userId;
    const serverUrl = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';
    
    socket = io(serverUrl, {
      auth: {
        userId: userId,
        userName: userName
      },
      timeout: 5000, // 5 second timeout
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
    });

    socket.on('disconnect', () => {
      console.log('⚠️ Socket.IO disconnected');
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket.IO connection error (video calls and typing indicators will not work):', error.message);
      // Don't show error to user - features will just be disabled
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
};
