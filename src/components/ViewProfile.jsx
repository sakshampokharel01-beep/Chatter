import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatLastSeen } from '../utils/formatLastSeen';

export default function ViewProfile({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setProfile({ id: userDoc.id, ...userDoc.data() });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal view-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loader" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal view-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal-header">
            <h2>Profile Not Found</h2>
            <button className="profile-close-btn" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal view-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>User Profile</h2>
          <button className="profile-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="profile-modal-content">
          {/* Profile Picture */}
          <div className="profile-picture-section">
            <div className="profile-picture-preview">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} onError={(e) => e.target.style.display = 'none'} />
              ) : (
                <div className="profile-picture-placeholder">
                  {profile.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="view-profile-name">
            {profile.displayName || 'Unknown User'}
            {profile.isAdmin && <span className="admin-tag-inline">Admin</span>}
          </div>

          {/* Online Status */}
          <div className="view-profile-status">
            {profile.online ? (
              <>
                <span className="online-indicator-inline"></span>
                Online
              </>
            ) : (
              formatLastSeen(profile.lastSeen, profile.online)
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="view-profile-bio">
              <div className="view-profile-bio-label">Bio</div>
              <div className="view-profile-bio-text">{profile.bio}</div>
            </div>
          )}

          {/* Guest Badge */}
          {profile.isAnonymous && (
            <div className="view-profile-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Guest User
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
