import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp, updateDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Helper to detect device info
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'Desktop';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect device type
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) deviceType = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) deviceType = 'Tablet';

  return { browser, os, deviceType };
};

// Generate a unique session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

export default function DeviceManagement({ user, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSessionId] = useState(getSessionId());

  useEffect(() => {
    if (!user) return;

    // Register current session
    const registerSession = async () => {
      const deviceInfo = getDeviceInfo();
      try {
        // Check if session already exists
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', user.uid),
          where('sessionId', '==', currentSessionId)
        );
        const existingSessions = await getDocs(q);
        
        if (existingSessions.empty) {
          await addDoc(collection(db, 'sessions'), {
            userId: user.uid,
            sessionId: currentSessionId,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            deviceType: deviceInfo.deviceType,
            lastActive: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('Failed to register session:', err);
      }
    };

    registerSession();

    // Subscribe to user's sessions
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by last active (most recent first)
      sessionList.sort((a, b) => {
        const aTime = a.lastActive?.toMillis?.() || 0;
        const bTime = b.lastActive?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      setSessions(sessionList);
      setLoading(false);
    }, (err) => {
      console.error('Failed to load sessions:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, currentSessionId]);

  // Update current session's lastActive every 30 seconds
  useEffect(() => {
    if (!user) return;

    const updateActivity = async () => {
      try {
        const currentSession = sessions.find(s => s.sessionId === currentSessionId);
        if (currentSession) {
          await updateDoc(doc(db, 'sessions', currentSession.id), {
            lastActive: serverTimestamp()
          });
        }
      } catch (err) {
        // Silently fail
      }
    };

    const interval = setInterval(updateActivity, 30000); // 30 seconds
    
    // Cleanup session on unmount/close
    const cleanup = async () => {
      try {
        const currentSession = sessions.find(s => s.sessionId === currentSessionId);
        if (currentSession) {
          await deleteDoc(doc(db, 'sessions', currentSession.id));
        }
      } catch (err) {
        // Silently fail
      }
    };

    window.addEventListener('beforeunload', cleanup);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [user, sessions, currentSessionId]);

  const handleLogoutDevice = async (sessionId, sessionDocId) => {
    if (sessionId === currentSessionId) {
      if (!window.confirm('This will log you out from this device. Continue?')) return;
      
      try {
        await deleteDoc(doc(db, 'sessions', sessionDocId));
        await auth.signOut();
      } catch (err) {
        console.error('Failed to logout:', err);
        alert('Failed to logout. Please try again.');
      }
    } else {
      if (!window.confirm('Log out this device?')) return;
      
      try {
        await deleteDoc(doc(db, 'sessions', sessionDocId));
      } catch (err) {
        console.error('Failed to logout device:', err);
        alert('Failed to logout device. Please try again.');
      }
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Log out from ALL devices except this one?')) return;
    
    try {
      const otherSessions = sessions.filter(s => s.sessionId !== currentSessionId);
      await Promise.all(
        otherSessions.map(s => deleteDoc(doc(db, 'sessions', s.id)))
      );
    } catch (err) {
      console.error('Failed to logout all devices:', err);
      alert('Failed to logout all devices. Please try again.');
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'Mobile':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        );
      case 'Tablet':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal device-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal device-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Active Sessions</h2>
          <button className="profile-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="profile-modal-content">
          <div className="device-info-text">
            Manage your active sessions across all devices. You can remotely log out from any device.
          </div>

          {sessions.length === 0 ? (
            <div className="device-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <p>No active sessions found</p>
            </div>
          ) : (
            <>
              <div className="device-list">
                {sessions.map((session) => {
                  const isCurrent = session.sessionId === currentSessionId;
                  return (
                    <div key={session.id} className={`device-item ${isCurrent ? 'current-device' : ''}`}>
                      <div className="device-icon">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="device-details">
                        <div className="device-name">
                          {session.browser} on {session.os}
                          {isCurrent && <span className="current-badge">This device</span>}
                        </div>
                        <div className="device-meta">
                          {session.deviceType} • {formatLastActive(session.lastActive)}
                        </div>
                      </div>
                      <button
                        className="device-logout-btn"
                        onClick={() => handleLogoutDevice(session.sessionId, session.id)}
                        title={isCurrent ? 'Log out' : 'Remove device'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {sessions.length > 1 && (
                <button className="logout-all-btn" onClick={handleLogoutAll}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log out all other devices
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
