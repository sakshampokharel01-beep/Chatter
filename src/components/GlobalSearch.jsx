import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import ViewProfile from './ViewProfile';
import '../styles/GlobalSearch.css';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString([], { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function highlightText(text, query) {
  if (!query || !text) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i}>{part}</mark> 
      : part
  );
}

export default function GlobalSearch({ user, onClose, onResultClick, friendIds }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { results, loading } = useGlobalSearch(searchQuery, user.uid, friendIds);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [friends, setFriends] = useState(new Set(friendIds || []));
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Load pending friend requests
  useEffect(() => {
    const loadPendingRequests = async () => {
      try {
        const q = query(
          collection(db, 'friendRequests'),
          where('from', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const pending = new Set(snapshot.docs.map(doc => doc.data().to));
        setPendingRequests(pending);
      } catch (err) {
        console.error('Failed to load pending requests:', err);
      }
    };
    loadPendingRequests();
  }, [user.uid]);

  // Update friends set when friendIds changes
  useEffect(() => {
    setFriends(new Set(friendIds || []));
  }, [friendIds]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleResultClick = (result) => {
    if (result.type === 'user') {
      // Don't close modal, just show profile
      return;
    }
    onResultClick(result);
    onClose();
  };

  const sendFriendRequest = async (toUser) => {
    try {
      // Check if already friends
      if (friends.has(toUser.id)) {
        alert('Already friends with this user');
        return;
      }

      // Check if request already sent
      if (pendingRequests.has(toUser.id)) {
        alert('Friend request already sent');
        return;
      }

      // Check if there's an incoming request from this user
      const incomingQ = query(
        collection(db, 'friendRequests'),
        where('from', '==', toUser.id),
        where('to', '==', user.uid)
      );
      const incomingSnap = await getDocs(incomingQ);
      if (!incomingSnap.empty) {
        alert('This user has already sent you a friend request. Check your Requests tab.');
        return;
      }

      // Send friend request
      await addDoc(collection(db, 'friendRequests'), {
        from: user.uid,
        fromName: user.displayName || 'User',
        fromPhoto: user.photoURL || '',
        to: toUser.id,
        toName: toUser.displayName || 'User',
        toPhoto: toUser.photoURL || '',
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      setPendingRequests(prev => new Set([...prev, toUser.id]));
      alert(`Friend request sent to ${toUser.displayName}`);
    } catch (err) {
      console.error('Failed to send friend request:', err);
      alert('Failed to send friend request: ' + err.message);
    }
  };

  const totalResults = results.messages.length + results.users.length + results.dms.length;

  return (
    <div className="global-search-overlay">
      <div className="global-search-modal" ref={modalRef}>
        {/* Header */}
        <div className="global-search-header">
          <div className="global-search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="global-search-input"
              placeholder="Search messages, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            {searchQuery && (
              <button 
                className="global-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button className="global-search-close" onClick={onClose} aria-label="Close search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="global-search-results">
          {loading && (
            <div className="global-search-loading">
              <div className="loader" style={{ width: '24px', height: '24px' }} />
              <span>Searching...</span>
            </div>
          )}

          {!loading && searchQuery.length >= 2 && totalResults === 0 && (
            <div className="global-search-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}

          {!loading && searchQuery.length < 2 && (
            <div className="global-search-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <p>Type at least 2 characters to search</p>
            </div>
          )}

          {/* Messages */}
          {!loading && results.messages.length > 0 && (
            <div className="global-search-section">
              <div className="global-search-section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Messages ({results.messages.length})</span>
              </div>
              {results.messages.map(msg => (
                <button
                  key={msg.id}
                  className="global-search-result-item"
                  onClick={() => handleResultClick({ ...msg, type: 'message', conversationId: 'global' })}
                >
                  <div className="global-search-result-content">
                    <div className="global-search-result-title">
                      {msg.displayName || 'User'}
                      {msg.isAdmin && <span className="admin-badge-small">Admin</span>}
                    </div>
                    <div className="global-search-result-text">
                      {highlightText(msg.text, searchQuery)}
                    </div>
                    <div className="global-search-result-meta">
                      Global Chat • {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Users */}
          {!loading && results.users.length > 0 && (
            <div className="global-search-section">
              <div className="global-search-section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Users ({results.users.length})</span>
              </div>
              {results.users.map(usr => {
                const isFriend = friends.has(usr.id);
                const hasPending = pendingRequests.has(usr.id);
                
                return (
                  <div key={usr.id} className="global-search-user-item">
                    <div className="global-search-result-avatar">
                      {usr.photoURL ? (
                        <img src={usr.photoURL} alt={usr.displayName} />
                      ) : (
                        <div className="global-search-result-avatar-placeholder">
                          {(usr.displayName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="global-search-result-content">
                      <div className="global-search-result-title">
                        {highlightText(usr.displayName, searchQuery)}
                        {isFriend && <span className="friend-badge-small">Friend</span>}
                        {hasPending && <span className="pending-badge-small">Pending</span>}
                      </div>
                      <div className="global-search-result-meta">
                        {usr.email || 'User profile'}
                      </div>
                    </div>
                    <div className="global-search-user-actions">
                      <button
                        className="global-search-action-btn"
                        onClick={() => setSelectedProfile(usr)}
                        title="View profile"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </button>
                      {!isFriend && !hasPending && (
                        <button
                          className="global-search-action-btn primary"
                          onClick={() => sendFriendRequest(usr)}
                          title="Send friend request"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="8.5" cy="7" r="4"/>
                            <line x1="20" y1="8" x2="20" y2="14"/>
                            <line x1="23" y1="11" x2="17" y2="11"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DMs */}
          {!loading && results.dms.length > 0 && (
            <div className="global-search-section">
              <div className="global-search-section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                <span>Private Messages ({results.dms.length})</span>
              </div>
              {results.dms.map(msg => (
                <button
                  key={msg.id}
                  className="global-search-result-item"
                  onClick={() => handleResultClick({ ...msg, type: 'dm', conversationId: msg.dmId })}
                >
                  <div className="global-search-result-content">
                    <div className="global-search-result-title">
                      {msg.displayName || 'User'}
                    </div>
                    <div className="global-search-result-text">
                      {highlightText(msg.text, searchQuery)}
                    </div>
                    <div className="global-search-result-meta">
                      Private Message • {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Profile Modal */}
      {selectedProfile && (
        <ViewProfile
          user={selectedProfile}
          currentUser={user}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}
