import React, { useState, useEffect } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  saveNotificationPreference,
  getNotificationPreference,
  showNotification,
} from '../utils/notifications';

export default function NotificationSettings({ onClose }) {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [enabled, setEnabled] = useState(getNotificationPreference());
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Update permission status when it changes
    const interval = setInterval(() => {
      setPermission(getNotificationPermission());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRequestPermission = async () => {
    setRequesting(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setRequesting(false);

    if (result === 'granted') {
      setEnabled(true);
      saveNotificationPreference(true);
      showNotification('Notifications enabled!', {
        body: 'You will now receive notifications for new messages and calls.',
      }, true); // Force show even if window is focused
    }
  };

  const handleToggle = (value) => {
    setEnabled(value);
    saveNotificationPreference(value);
    
    if (value && permission === 'granted') {
      showNotification('Notifications enabled!', {
        body: 'You will receive notifications for new messages and calls.',
      }, true); // Force show even if window is focused
    }
  };

  const handleTestNotification = () => {
    showNotification('Test Notification', {
      body: 'This is a test notification from Chatter!',
    }, true); // Force show even if window is focused
  };

  if (!isNotificationSupported()) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal notification-modal" onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal-header">
            <h2>Notifications</h2>
            <button className="profile-close-btn" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="profile-modal-content">
            <div className="notification-unsupported">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <h3>Notifications Not Supported</h3>
              <p>Your browser doesn't support push notifications.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Notification Settings</h2>
          <button className="profile-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="profile-modal-content">
          <div className="notification-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div>
              <strong>Stay updated</strong>
              <p>Get notified about new messages, calls, and friend requests even when Chatter is in the background.</p>
            </div>
          </div>

          {/* Permission Status */}
          <div className="notification-status">
            <div className="notification-status-label">Permission Status</div>
            <div className={`notification-status-badge ${permission}`}>
              {permission === 'granted' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Granted
                </>
              )}
              {permission === 'denied' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Denied
                </>
              )}
              {permission === 'default' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  Not Set
                </>
              )}
            </div>
          </div>

          {/* Request Permission Button */}
          {permission !== 'granted' && (
            <div className="notification-section">
              {permission === 'denied' ? (
                <div className="notification-denied">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <div>
                    <strong>Permission Denied</strong>
                    <p>You've blocked notifications. To enable them, click the lock icon in your browser's address bar and allow notifications.</p>
                  </div>
                </div>
              ) : (
                <button
                  className="notification-request-btn"
                  onClick={handleRequestPermission}
                  disabled={requesting}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {requesting ? 'Requesting...' : 'Enable Notifications'}
                </button>
              )}
            </div>
          )}

          {/* Toggle Switch */}
          {permission === 'granted' && (
            <>
              <div className="notification-toggle">
                <div className="notification-toggle-info">
                  <strong>Enable Notifications</strong>
                  <p>Receive notifications for new messages and calls</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleToggle(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Test Button */}
              {enabled && (
                <button
                  className="notification-test-btn"
                  onClick={handleTestNotification}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  Send Test Notification
                </button>
              )}
            </>
          )}

          {/* What you'll receive */}
          <div className="notification-features">
            <div className="notification-features-title">You'll be notified about:</div>
            <ul className="notification-features-list">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                New direct messages
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Incoming calls
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Friend requests
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
