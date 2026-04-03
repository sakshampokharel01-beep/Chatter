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

      setProfileData({ id: user.id, ...user.data() });

      // Load friend count
      const friendsQuery = query(
        collection(db, 'friends'),
        where('users', 'array-contains', userId)
      );
      const friendsSnap = await getDocs(friendsQuery);
      setFriendCount(friendsSnap.size);

      // Check if current user is friends with this user
      const isFriendCheck = friendsSnap.docs.some(doc => 
        doc.data().users.includes(currentUserId)
      );
      setIsFriend(isFriendCheck);

      // Load mutual friends
      if (currentUserId) {
        const currentUserFriendsQuery = query(
          collection(db, 'friends'),
          where('users', 'array-contains', currentUserId)
        );
        const currentUserFriendsSnap = await getDocs(currentUserFriendsQuery);
        const currentUserFriendIds = new Set();
        currentUserFriendsSnap.docs.forEach(doc => {
          const friendId = doc.data().users.find(id => id !== currentUserId);
          if (friendId) currentUserFriendIds.add(friendId);
        });

        const targetUserFriendIds = new Set();
        friendsSnap.docs.forEach(doc => {
          const friendId = doc.data().users.find(id => id !== userId);
          if (friendId) targetUserFriendIds.add(friendId);
        });

        const mutualIds = [...currentUserFriendIds].filter(id => targetUserFriendIds.has(id));
        
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
        <div className="public-profile-modal" onClick={e => e.stopPropagation()}>
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
        <div className="public-profile-modal" onClick={e => e.stopPropagation()}>
          <div className="profile-error">User not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="public-profile-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="public-profile-content">
          {/* Profile Header */}
          <div className="public-profile-header">
            <div className="public-profile-avatar-large">
              {profileData.photoURL ? (
                <img src={profileData.photoURL} alt={profileData.displayName} />
              ) : (
                <div className="avatar-placeholder-large">
                  {(profileData.displayName || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="public-profile-info">
              <h2 className="public-profile-name">{profileData.displayName}</h2>
              {profileData.email && (
                <p className="public-profile-email">{profileData.email}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="public-profile-stats">
            <div className="profile-stat">
              <span className="stat-value">{friendCount}</span>
              <span className="stat-label">Friends</span>
            </div>
            {mutualFriends.length > 0 && (
              <div className="profile-stat">
                <span className="stat-value">{mutualFriends.length}</span>
                <span className="stat-label">Mutual</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profileData.bio && (
            <div className="public-profile-bio">
              <h3>Bio</h3>
              <p>{profileData.bio}</p>
            </div>
          )}

          {/* Mutual Friends */}
          {mutualFriends.length > 0 && (
            <div className="public-profile-mutual">
              <h3>Mutual Friends</h3>
              <div className="mutual-friends-list">
                {mutualFriends.map(friend => (
                  <div key={friend.id} className="mutual-friend-item">
                    <div className="mutual-friend-avatar">
                      {friend.photoURL ? (
                        <img src={friend.photoURL} alt={friend.displayName} />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {(friend.displayName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="mutual-friend-name">{friend.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="public-profile-actions">
            {isFriend ? (
              <>
                <button className="profile-action-btn primary" onClick={() => onSendMessage(profileData)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Message
                </button>
                <button className="profile-action-btn secondary" onClick={() => onRemoveFriend(profileData)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  Unfriend
                </button>
              </>
            ) : hasPendingRequest ? (
              <button className="profile-action-btn disabled" disabled>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Request Sent
              </button>
            ) : (
              <button className="profile-action-btn primary" onClick={() => onAddFriend(profileData)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      </div>
    </div>
  );
}
