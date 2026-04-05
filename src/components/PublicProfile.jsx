import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function PublicProfile({ userId, currentUserId, onClose, onSendMessage, onAddFriend, onRemoveFriend }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendCount, setFriendCount] = useState(0);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [userId, currentUserId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load user data
      const usersSnap = await getDocs(collection(db, 'users'));
      const user = usersSnap.docs.find(doc => doc.id === userId);
      
      if (!user) {
        setLoading(false);
        return;
      }

      const userData = { id: user.id, ...user.data() };
      setProfileData(userData);

      // Load friend count - DEDUPLICATE to get actual unique friends
      const friendsQuery = query(
        collection(db, 'friends'),
        where('users', 'array-contains', userId)
      );
      const friendsSnap = await getDocs(friendsQuery);
      
      // Get unique friend IDs (deduplicate)
      const uniqueFriendIds = new Set();
      friendsSnap.docs.forEach(doc => {
        const users = doc.data().users;
        const friendId = users.find(id => id !== userId);
        if (friendId) {
          uniqueFriendIds.add(friendId);
        }
      });
      
      // Set the ACTUAL unique friend count
      setFriendCount(uniqueFriendIds.size);

      // Check if current user is friends with this user
      const isFriendCheck = uniqueFriendIds.has(currentUserId);
      setIsFriend(isFriendCheck);

      // Load mutual friends
      if (currentUserId) {
        const currentUserFriendsQuery = query(
          collection(db, 'friends'),
          where('users', 'array-contains', currentUserId)
        );
        const currentUserFriendsSnap = await getDocs(currentUserFriendsQuery);
        
        // Get unique friend IDs for current user (deduplicate)
        const currentUserFriendIds = new Set();
        currentUserFriendsSnap.docs.forEach(doc => {
          const friendId = doc.data().users.find(id => id !== currentUserId);
          if (friendId) currentUserFriendIds.add(friendId);
        });

        // Find mutual friends (intersection of both sets)
        const mutualIds = [...uniqueFriendIds].filter(id => currentUserFriendIds.has(id));
        
        // Load mutual friend details
        const mutualFriendData = [];
        for (const mutualId of mutualIds.slice(0, 3)) { // Show max 3
          const mutualUser = usersSnap.docs.find(doc => doc.id === mutualId);
          if (mutualUser) {
            mutualFriendData.push({ id: mutualUser.id, ...mutualUser.data() });
          }
        }
        setMutualFriends(mutualFriendData);
      }

      // Check for pending friend request
      const pendingQuery = query(
        collection(db, 'friendRequests'),
        where('from', '==', currentUserId),
        where('to', '==', userId)
      );
      const pendingSnap = await getDocs(pendingQuery);
      setHasPendingRequest(!pendingSnap.empty);

      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="public-profile-modal-large" onClick={e => e.stopPropagation()}>
          <div className="profile-loading">
            <div className="loader" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="public-profile-modal-large" onClick={e => e.stopPropagation()}>
          <div className="profile-error">User not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="public-profile-modal-large" onClick={e => e.stopPropagation()}>
        {/* Modern Close Button */}
        <button className="profile-modal-close-btn" onClick={onClose} aria-label="Close profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="public-profile-content-large">
          {/* Top Section */}
          <div className="profile-top-section">
            <div className="profile-avatar-container">
              <div className="public-profile-avatar-xl">
                {profileData.photoURL ? (
                  <img src={profileData.photoURL} alt={profileData.displayName} />
                ) : (
                  <div className="avatar-placeholder-xl">
                    {(profileData.displayName || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                {profileData.online && <div className="profile-online-badge"></div>}
              </div>
            </div>

            <div className="profile-info-section">
              <div className="profile-header-row">
                <div className="profile-username-wrapper">
                  <h1 className="profile-username">{profileData.displayName}</h1>
                  {profileData.isAdmin && (
                    <span className="profile-verified-badge" title="Admin">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </span>
                  )}
                </div>
                <div className="profile-action-buttons">
                  {isFriend ? (
                    <>
                      <button className="profile-btn-primary" onClick={() => onSendMessage(profileData)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Message
                      </button>
                      <button className="profile-btn-secondary" onClick={() => onRemoveFriend(profileData)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="8.5" cy="7" r="4"/>
                          <line x1="18" y1="8" x2="23" y2="13"/>
                          <line x1="23" y1="8" x2="18" y2="13"/>
                        </svg>
                        Unfriend
                      </button>
                    </>
                  ) : hasPendingRequest ? (
                    <button className="profile-btn-disabled" disabled>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Requested
                    </button>
                  ) : (
                    <button className="profile-btn-primary" onClick={() => onAddFriend(profileData)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                      Add Friend
                    </button>
                  )}
                </div>
              </div>

              <div className="profile-stats-row">
                <div className="profile-stat-item">
                  <span className="stat-number">{friendCount}</span>
                  <span className="stat-text">friends</span>
                </div>
                {mutualFriends.length > 0 && (
                  <div className="profile-stat-item">
                    <span className="stat-number">{mutualFriends.length}</span>
                    <span className="stat-text">mutual</span>
                  </div>
                )}
              </div>

              <div className="profile-details">
                <div className="profile-fullname">{profileData.displayName}</div>
                {profileData.bio && (
                  <div className="profile-bio-text">{profileData.bio}</div>
                )}
                {profileData.email && (
                  <div className="profile-email-text">{profileData.email}</div>
                )}
              </div>
            </div>
          </div>

          {/* Mutual Friends Section */}
          {mutualFriends.length > 0 && (
            <div className="profile-mutual-section">
              <div className="mutual-header">
                <h2>Mutual Friends</h2>
                <span className="mutual-count">{mutualFriends.length}</span>
              </div>
              <div className="mutual-grid">
                {mutualFriends.map(friend => (
                  <div key={friend.id} className="mutual-card">
                    <div className="mutual-avatar">
                      {friend.photoURL ? (
                        <img src={friend.photoURL} alt={friend.displayName} />
                      ) : (
                        <div className="avatar-placeholder-mutual">
                          {(friend.displayName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="mutual-name">{friend.displayName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
