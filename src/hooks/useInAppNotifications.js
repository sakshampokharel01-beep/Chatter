import { useState, useCallback } from 'react';

export function useInAppNotifications() {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  }, []);

  const hideNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAll,
  };
}

// Helper functions to show specific types of notifications
export const createMessageNotification = (senderName, messageText, avatar) => ({
  type: 'message',
  title: senderName,
  message: messageText.slice(0, 80) + (messageText.length > 80 ? '...' : ''),
  avatar: avatar || senderName.charAt(0).toUpperCase(),
});

export const createCallNotification = (callerName, isVideoCall, avatar) => ({
  type: 'call',
  title: `Incoming ${isVideoCall ? 'video' : 'audio'} call`,
  message: `${callerName} is calling you...`,
  avatar: avatar || callerName.charAt(0).toUpperCase(),
  icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
});

export const createFriendRequestNotification = (senderName, avatar) => ({
  type: 'friend-request',
  title: 'New friend request',
  message: `${senderName} wants to be your friend`,
  avatar: avatar || senderName.charAt(0).toUpperCase(),
  icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
});
