import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth, getDisplayName } from '../firebase';

const MAX_BIO_LENGTH = 150;
const MAX_NAME_LENGTH = 64;

export default function UserProfile({ user, onClose }) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isGuest = user?.isAnonymous;

  // Load current profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setDisplayName(getDisplayName(user));
      setPhotoURL(user.photoURL || '');
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setBio(data.bio || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    if (displayName.length > MAX_NAME_LENGTH) {
      setError(`Display name must be ${MAX_NAME_LENGTH} characters or less`);
      return;
    }

    if (bio.length > MAX_BIO_LENGTH) {
      setError(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
        bio: bio.trim(),
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Edit Profile</h2>
          <button className="profile-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="profile-modal-content">
          {/* Profile Picture Preview */}
          <div className="profile-picture-section">
            <div className="profile-picture-preview">
              {photoURL ? (
                <img src={photoURL} alt="Profile" onError={(e) => e.target.style.display = 'none'} />
              ) : (
                <div className="profile-picture-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="profile-field">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              placeholder="Your name"
              disabled={saving}
              maxLength={MAX_NAME_LENGTH}
            />
            <span className="profile-char-count">
              {displayName.length}/{MAX_NAME_LENGTH}
            </span>
          </div>

          {/* Bio */}
          <div className="profile-field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
              placeholder="Tell us about yourself..."
              disabled={saving}
              rows={3}
              maxLength={MAX_BIO_LENGTH}
            />
            <span className="profile-char-count">
              {bio.length}/{MAX_BIO_LENGTH}
            </span>
          </div>

          {/* Photo URL */}
          <div className="profile-field">
            <label htmlFor="photoURL">Profile Picture URL</label>
            <input
              id="photoURL"
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              disabled={saving}
            />
            <span className="profile-hint">
              Enter a URL to your profile picture (must be HTTPS)
            </span>
          </div>

          {/* Guest Warning */}
          {isGuest && (
            <div className="profile-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Guest profiles are temporary and will be lost when you sign out.
            </div>
          )}

          {/* Error/Success Messages */}
          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}

          {/* Action Buttons */}
          <div className="profile-actions">
            <button
              className="profile-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="profile-save-btn"
              onClick={handleSave}
              disabled={saving || !displayName.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
