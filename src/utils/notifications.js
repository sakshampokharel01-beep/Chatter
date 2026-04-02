/**
 * Notification utilities for browser push notifications
 */

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Get current notification permission status
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
};

// Show a notification
export const showNotification = (title, options = {}, force = false) => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  // Don't show notification if window is focused (unless forced for testing)
  if (!force && document.hasFocus()) {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (err) {
    console.error('Failed to show notification:', err);
    return null;
  }
};

// Show notification for new message
export const showMessageNotification = (senderName, messageText, onClick) => {
  const notification = showNotification(`New message from ${senderName}`, {
    body: messageText.slice(0, 100) + (messageText.length > 100 ? '...' : ''),
    tag: `message-${senderName}`,
    renotify: false,
  });

  if (notification && onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }

  return notification;
};

// Show notification for incoming call
export const showCallNotification = (callerName, isVideoCall, onAccept, onReject) => {
  const notification = showNotification(`Incoming ${isVideoCall ? 'video' : 'audio'} call`, {
    body: `${callerName} is calling you...`,
    tag: `call-${callerName}`,
    requireInteraction: true,
    actions: [
      { action: 'accept', title: 'Accept' },
      { action: 'reject', title: 'Reject' },
    ],
  });

  if (notification) {
    notification.onclick = () => {
      window.focus();
      if (onAccept) onAccept();
      notification.close();
    };

    // Note: notification.actions are not widely supported yet
    // Most browsers will just show the notification without action buttons
  }

  return notification;
};

// Show notification for friend request
export const showFriendRequestNotification = (senderName, onClick) => {
  const notification = showNotification('New friend request', {
    body: `${senderName} wants to be your friend`,
    tag: `friend-request-${senderName}`,
  });

  if (notification && onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }

  return notification;
};

// Save notification preference to localStorage
export const saveNotificationPreference = (enabled) => {
  localStorage.setItem('notificationsEnabled', enabled ? 'true' : 'false');
};

// Get notification preference from localStorage
export const getNotificationPreference = () => {
  const pref = localStorage.getItem('notificationsEnabled');
  return pref === null ? true : pref === 'true'; // Default to enabled
};

// Check if notifications are enabled (permission + user preference)
export const areNotificationsEnabled = () => {
  return (
    isNotificationSupported() &&
    Notification.permission === 'granted' &&
    getNotificationPreference()
  );
};
