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
    socket = io(import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001', {
      auth: {
        userId: userId,
        userName: userName
      }
    });

    socket.on('connect', () => {
      // Socket connected
    });

    socket.on('disconnect', () => {
      // Socket disconnected
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
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
